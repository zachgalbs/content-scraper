import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// 1. Define the function metadata, inputs, and outputs
export const SendArticleMessagesFunction = DefineFunction({
  callback_id: "send_article_messages_function",
  title: "Send Article Messages",
  description: "Iterate over articles and send messages for each",
  source_file: "functions/send-article-messages.ts",
  input_parameters: {
    properties: {
      articles: {
        type: Schema.types.array,
        items: {
          type: Schema.types.object,
          properties: {
            title: { type: Schema.types.string },
            link: { type: Schema.types.string },
            pubDate: { type: Schema.types.string },
            creator: { type: Schema.types.string },
            summary: { type: Schema.types.string },
            source: { type: Schema.types.string },
            score: { type: Schema.types.number },
            explanation: { type: Schema.types.string },
          },
          required: [
            "title",
            "link",
            "pubDate",
            "creator",
            "summary",
            "source",
            "score",
            "explanation",
          ],
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
