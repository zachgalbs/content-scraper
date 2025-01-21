import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import { ArticleDatastore } from "../../datastores/article-object-definition.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { articlesSchema } from "../other/article-definition.ts";
export const StoreArticleFunction = DefineFunction({
  callback_id: "store_article_function",
  title: "Store Articles",
  description: "Stores a list of articles in the ArticleDatastore",
  source_file: "functions/return_articles/store-articles.ts",
  input_parameters: {
    properties: {
      articles: articlesSchema,
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
