import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";

// 1. Define the function metadata, inputs, and outputs
export const SendArticleMessagesFunction = DefineFunction({
  callback_id: "send_article_messages_function",
  title: "Send Article Messages",
  description: "Iterate over articles and send messages for each",
  source_file: "functions/return_articles/send-article-messages.ts",
  input_parameters: {
    properties: {
      articles: {
        type: Schema.types.array,
        items: {
          type: ArticleType,
        },
      },
      channel_id: {
        type: Schema.types.string,
      },
    },
    required: ["articles", "channel_id"],
  },
  output_parameters: {
    properties: {
      success: {
        type: Schema.types.boolean,
      },
      message: {
        type: Schema.types.string,
      },
    },
    required: ["success"],
  },
});

// 2. Implement the function logic
export default SlackFunction(
  SendArticleMessagesFunction,
  async ({ inputs, client }) => {
    const { articles, channel_id } = inputs;

    // Check if the articles array is empty
    if (!articles || articles.length === 0) {
      // If there are no articles, still proceed without sending messages
      return {
        outputs: {
          success: true,
          message: "Couldn't find any new, relevant articles to send 😔",
        },
      };
    }

    // Send a greeting message
    const greetingMessage = "Hey! Here are some articles I think you'll like:";
    await client.chat.postMessage({
      channel: channel_id,
      text: greetingMessage,
    });

    for (const article of articles) {
      const readablePubDate = new Date(article.pubDate).toLocaleString(
        "en-US",
        {
          weekday: "long",
          month: "short",
          day: "numeric",
        },
      );
      const messageText = `*Title:* ${article.title}\n` +
        `*Link:* ${article.link}\n` +
        `*Published on:* ${readablePubDate}\n` +
        `*Summary:* ${article.summary}\n` +
        `*Score:* ${article.score || "N/A"}\n` +
        `*Explanation:* ${article.explanation || "N/A"}`;
      // 🤖 Send the message via chat.postMessage API:
      const postResp = await client.chat.postMessage({
        channel: channel_id,
        text: messageText,
      });

      // ⚠️ If something goes wrong, bail early and report an error
      if (!postResp.ok) {
        return {
          outputs: {
            success: false,
            message:
              `Failed to send message for article "${article.title}": ${postResp.error}`,
          },
        };
      }
    }

    // ✅ If everything succeeded:
    return {
      outputs: {
        success: true,
        message: "All article messages sent successfully!",
      },
    };
  },
);
