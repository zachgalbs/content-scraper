import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleDatastore } from "../../datastores/datastore-definition.ts";

export const AnalyzeReactionFunctionDefinition = DefineFunction({
  callback_id: "analyze-reaction",
  title: "Analyze a reaction",
  description: "Analyzes a reaction and returns a message",
  source_file: "functions/reactions/analyze-reaction.ts",
  input_parameters: {
    properties: {
      reaction: { type: Schema.types.string },
      message_ts: { type: Schema.types.string },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["reaction", "message_ts", "channel"],
  },
  output_parameters: {
    properties: {
      message: {
        type: Schema.types.string,
        description: "Message returned after updating",
      },
    },
    required: ["message"],
  },
});

export default SlackFunction(
  AnalyzeReactionFunctionDefinition,
  async ({ inputs, client }) => {
    try {
      // 1) Fetch the original message
      const msgResp = await client.conversations.history({
        channel: inputs.channel,
        latest: inputs.message_ts,
        limit: 1,
        inclusive: true,
      });

      if (!msgResp.ok || !msgResp.messages?.[0]) {
        console.error("Failed to find the original message:", {
          channel: inputs.channel,
          ts: inputs.message_ts,
          error: msgResp.error,
        });
        return { outputs: { message: "Could not find the original message." } };
      }

      const originalMessage = msgResp.messages[0].text ?? "";

      // 2) Parse fields from message
      const lines = originalMessage.split("\n").filter((l: string) =>
        l.trim() !== ""
      );
      const extractField = (key: string): string | undefined => {
        const prefix = `${key}:`;
        const line = lines.find((ln: string) => ln.startsWith(prefix));
        if (!line) return undefined;

        // Remove the prefix and any bold formatting
        return line
          .replace(prefix, "")
          .replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, "$1$2")
          .trim();
      };

      const title = extractField("Title");
      let link = extractField("Link");
      const summary = extractField("Summary"); // optional use, if your message includes it

      if (!title || !link) {
        console.error("Message missing Title: or Link: in expected format.");
        return {
          outputs: {
            message:
              "Message format not recognized. Need 'Title:' and 'Link:'.",
          },
        };
      }

      // 3) Clean up link in case Slack wraps it like <http://example.com|example.com>
      const match = link.match(/<(.*?)>/)?.[1];
      if (match) {
        link = match.includes("|") ? match.split("|")[0] : match;
      }

      // 4) Generate article ID (ensure it matches how the article was stored)
      const articleId = `${title}-${link}`;

      // 5) Attempt to fetch the article from datastore
      const getResp = await client.apps.datastore.get<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        id: articleId,
      });

      let article = getResp.item;
      // If the datastore GET was "ok" but the item is missing or empty, do some detective work
      const isEmptyObject = article && Object.keys(article).length === 0;
      if (!getResp.ok || !article || isEmptyObject) {
        console.warn(
          "Article not found with ID or returned empty object:",
          articleId,
        );

        // 5a) Query the datastore for an item with matching title

        const queryResp = await client.apps.datastore.query<
          typeof ArticleDatastore.definition
        >({
          datastore: ArticleDatastore.name,
          // Slack's expression syntax allows filters. We'll check if there's a 'title' property
          // that equals our extracted title. (If your actual field name is different, change below.)
          expression: "#title = :val",
          expression_attributes: { "#title": "title" },
          expression_values: { ":val": title },
        });

        if (!queryResp.ok) {
          console.error(
            "Query to find matching title failed:",
            queryResp.error,
          );
          return {
            outputs: {
              message: "Article not found or error on title-based search.",
            },
          };
        }

        if (queryResp.items.length === 0) {
          console.error("No articles found matching the Title:", title);
          return {
            outputs: {
              message: "No article matches that title in the datastore.",
            },
          };
        }

        // If multiple items have the same title, we’ll just pick the first one
        article = queryResp.items[0];
      }

      // 6) Map article fields to safe fallback values
      const readablePubDate = article.pubDate
        ? new Date(article.pubDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        : "Unknown";

      const timesPosted = article.times_posted ?? "Unknown";
      const relevanceScore = article.relevance_score ?? "Unknown";
      const explanation = article.explanation ?? "Not available";

      // Clean up link if it's wrapped in Slack formatting
      const cleanLink = link.match(/<(.*?)>/)?.[1]?.split("|")[0] || link;

      // 7) Create updated message with additional information
      const updatedMessageParts = [
        originalMessage,
        "\n",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "📌 *Extra Article Info*",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "\n",
        ` *Published:* ${readablePubDate || "Date unavailable"}`,
        "\n",
        ` *Times Shared:* ${timesPosted}`,
        "\n",
        ` *Relevance Score:* ${relevanceScore}`,
        "\n",
        ` *Explanation:* ${explanation || "No additional details available."}`,
        "\n",
        `*Read the full article:  *<${cleanLink}>`,
      ];

      // filter out any empty lines (like if summary is undefined)
      const updatedMessage = updatedMessageParts.filter(Boolean).join("\n");

      // 8) Update Slack message
      const updateResp = await client.chat.update({
        channel: inputs.channel,
        ts: inputs.message_ts,
        text: updatedMessage,
      });
      if (!updateResp.ok) {
        console.error("Failed to update Slack message:", updateResp.error);
        return { outputs: { message: "Failed to update the Slack message." } };
      }

      return { outputs: { message: updatedMessage } };
    } catch (error) {
      console.error("Error in analyze-reaction:", error);
      return {
        outputs: {
          message: "An error occurred while processing the reaction.",
        },
      };
    }
  },
);
