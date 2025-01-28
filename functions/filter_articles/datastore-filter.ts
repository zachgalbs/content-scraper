import { ArticleDatastore } from "../../datastores/datastore-definition.ts";
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";

export const FilterDatastoreArticlesFunction = DefineFunction({
  callback_id: "datastore_filter_articles_function",
  title: "Datastore Filter Articles",
  description: "Filters articles based on uniqueness and relevance score",
  source_file: "functions/filter_articles/datastore-filter.ts",
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
      articles: {
        type: Schema.types.array,
        items: {
          type: ArticleType,
        },
      },
    },
    required: ["articles"],
  },
});

export default SlackFunction(
  FilterDatastoreArticlesFunction,
  async ({ inputs, client }) => {
    const { articles } = inputs;
    const filteredArticles = [];

    // Function to clear all items from the datastore
    async function clearDatastore() {
      try {
        // Fetch all items from the datastore
        const allItems = await client.apps.datastore.query({
          datastore: ArticleDatastore.name,
        });

        if (allItems.ok && allItems.items.length > 0) {
          for (const item of allItems.items) {
            await client.apps.datastore.delete({
              datastore: ArticleDatastore.name,
              id: item.id,
            });
          }
        } else {
          console.log("No articles found in the datastore to delete.");
        }
      } catch (error) {
        console.error("Failed to clear the datastore:", error);
      }
    }

    await clearDatastore();

    for (const article of articles) {
      // Check if the article title already exists in the datastore
      const existingArticle = await client.apps.datastore.get({
        datastore: ArticleDatastore.name,
        id: `${article.title}-${article.pubDate}`,
      });
      // if the get request is successful and there are properties in the item, we have successfully located the article and we can skip it
      if (existingArticle.ok && existingArticle.item.title) {
        console.log(`Article with title "${article.title}" already exists.`);
        continue; // Skip if the article already exists
      }

      // If the article does not exist in the datastore, add it to the filtered list
      console.log(
        `Adding article with title "${article.title}" to filtered list.`,
      );
      filteredArticles.push(article);
    }

    return {
      outputs: {
        articles: filteredArticles,
      },
    };
  },
);
