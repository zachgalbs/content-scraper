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
      // Check if the article already exists in the datastore
      const getResp = await client.apps.datastore.get<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        id: `${article.title}-${article.link}`,
      });

      if (getResp.ok && getResp.item) {
        console.log(`Article already exists: ${article.title}`);

        // Update the relevance_score of the existing article
        const updateResp = await client.apps.datastore.put<
          typeof ArticleDatastore.definition
        >({
          datastore: ArticleDatastore.name,
          item: {
            ...getResp.item,
            relevance_score: article.score, // Update the relevance_score
          },
        });

        if (!updateResp.ok) {
          const updateErrorMsg =
            `Error updating article: ${article.title}. Contact the app maintainers with the following information - (Error detail: ${updateResp.error})`;
          console.log(updateErrorMsg);

          return { error: updateErrorMsg };
        }

        continue; // Skip storing this article as new
      }

      // Attempt to store each new article in the datastore
      const putResp = await client.apps.datastore.put<
        typeof ArticleDatastore.definition
      >({
        datastore: ArticleDatastore.name,
        item: {
          id: `${article.title}-${article.link}`,
          title: article.title,
          link: article.link,
          pubDate: article.pubDate,
          times_posted: 0,
          relevance_score: article.score,
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
        message: "All new articles stored successfully.",
      },
    };
  },
);
