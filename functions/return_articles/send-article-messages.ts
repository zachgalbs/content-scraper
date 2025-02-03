import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";
import { ArticleDatastore } from "../../datastores/datastore-definition.ts";

// 1. Define Function
export const SendArticleMessagesFunction = DefineFunction({
  callback_id: "send_article_messages_function",
  title: "Send Article Messages",
  description: "Iterate over articles and send messages for each",
  source_file: "functions/return_articles/send-article-messages.ts",
  input_parameters: {
    properties: {
      articles: {
        type: Schema.types.array,
        items: { type: ArticleType },
      },
      channel_id: { type: Schema.types.string },
    },
    required: ["articles", "channel_id"],
  },
  output_parameters: {
    properties: {
      success: { type: Schema.types.boolean },
      message: { type: Schema.types.string },
    },
    required: ["success"],
  },
});

// 2. Implement Function Logic
export default SlackFunction(
  SendArticleMessagesFunction,
  async ({ inputs, client }) => {
    const { articles, channel_id } = inputs;

    // If no articles, just return a friendly note
    if (!articles?.length) {
      return {
        outputs: {
          success: true,
          message: "Couldn't find any new, relevant articles to send 😔",
        },
      };
    }

    // 1) Send a greeting
    await client.chat.postMessage({
      channel: channel_id,
      text: "Hey! Here are some articles I think you'll like:",
    });

    // 2) Iterate over articles
    for (const article of articles) {
      const articleId = `${article.title}-${article.link}`;

      // a) Check the times_posted from datastore
      const getResp = await client.apps.datastore.get<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        id: articleId,
      });

      // If found and times_posted > 3, skip sending
      if (getResp.ok && getResp.item) {
        if ((getResp.item.times_posted ?? 0) > 3) {
          console.log(`Skipping ${article.title}; already posted > 3 times.`);
          continue;
        }
      }

      // b) Post the article message with a *bolded* title
      const postMessage = [
        `Title: *${article.title}*`, // Bold the title here
        "",
        `Summary: ${article.summary || "No summary available"}`,
        "",
        `Link: <${article.link}>`,
      ].join("\n");

      const postResp = await client.chat.postMessage({
        channel: channel_id,
        text: postMessage,
      });
      if (!postResp.ok) {
        return {
          outputs: {
            success: false,
            message:
              `Failed to send message for "${article.title}": ${postResp.error}`,
          },
        };
      }

      // c) Update the times_posted in datastore
      const existingTimesPosted = getResp.item?.times_posted ?? 0;
      const updateResp = await client.apps.datastore.put<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        item: {
          // Keep existing fields if we had an article item,
          // otherwise create a new one with this ID.
          ...getResp.item,
          id: articleId,
          times_posted: existingTimesPosted + 1,
        },
      });

      if (!updateResp.ok) {
        console.log(`Failed to update times_posted for "${article.title}".`);
      }
    }

    // 3) Return success
    return {
      outputs: {
        success: true,
        message: "All article messages sent successfully!",
      },
    };
  },
);
