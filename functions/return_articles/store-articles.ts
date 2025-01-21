import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import { ArticleDatastore } from "../../datastores/article-object-definition.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";

export const StoreArticleFunction = DefineFunction({
  callback_id: "store_article_function",
  title: "Store Articles",
  description: "Stores a list of articles in the ArticleDatastore",
  source_file: "functions/datastore.ts",
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
    },
    required: ["articles"],
  },
  output_parameters: {
    properties: {
      success: { type: Schema.types.boolean },
      message: { type: Schema.types.string },
    },
    required: ["success"],
  },
});

export default SlackFunction(
  StoreArticleFunction,
  async ({ inputs, client }) => {
    for (const article of inputs.articles) {
      // Attempt to store each article in the datastore
      const putResp = await client.apps.datastore.put<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        item: {
          title: article.title,
          link: article.link,
          pubDate: article.pubDate,
        },
      });

      if (!putResp.ok) {
        const draftSaveErrorMsg =
          `Error saving article: ${article.title}. Contact the app maintainers with the following information - (Error detail: ${putResp.error})`;
        console.log(draftSaveErrorMsg);

        return { error: draftSaveErrorMsg };
      }
    }

    return {
      outputs: {
        success: true,
        message: "All articles stored successfully.",
      },
    };
  },
);
