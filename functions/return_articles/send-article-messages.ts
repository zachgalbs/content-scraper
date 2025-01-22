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

    // check if the articles array is empty (via checking if the first article has no title)
    if (!articles[0]?.title) {
      return {
        outputs: {
          success: false,
          message: "No articles to send.",
        },
      };
    }

    for (const article of articles) {
      // 🗞️ Construct your message text:
      const messageText =
        `*${article.title}*\n${article.link}\nPublished on: ${article.pubDate}\n${article.summary}`;

      // 🤖 Send the message via chat.postMessage API:
      const postResp = await client.chat.postMessage({
        channel: channel_id,
        text: messageText,
      });

      // ⚠️ If something goes wrong, bail early and report an error
      if (!postResp.ok) {
        return {
          error:
            `Failed to send message for article "${article.title}": ${postResp.error}`,
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
