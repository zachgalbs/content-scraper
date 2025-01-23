import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import { ArticleDatastore } from "../../datastores/datastore-definition.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";

export const StoreArticleFunction = DefineFunction({
  callback_id: "store_article_function",
  title: "Store Articles",
  description: "Stores a list of articles in the ArticleDatastore",
  source_file: "functions/return_articles/store-articles.ts",
  input_parameters: {
    properties: {
      articles: {
        type: Schema.types.array,
        items: {
          type: ArticleType,
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
    const { articles } = inputs;

    // check if the articles array is empty (via checking if the first article has no title)
    if (!articles[0]?.title) {
      return {
        outputs: {
          success: false,
          message: "No articles to store.",
        },
      };
    }

    for (const article of articles) {
      // Attempt to store each article in the datastore
      const putResp = await client.apps.datastore.put<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        item: {
          id: `${article.title}-${article.pubDate}`,
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
