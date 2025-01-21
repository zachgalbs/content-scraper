import { ArticleDatastore } from "../../datastores/article-object-definition.ts";
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { articlesSchema } from "../other/article-definition.ts";

export const FilterDatastoreArticlesFunction = DefineFunction({
  callback_id: "datastore_filter_articles_function",
  title: "Datastore Filter Articles",
  description: "Filters articles based on uniqueness and relevance score",
  source_file: "functions/filter_articles/datastore-filter.ts",
  input_parameters: {
    properties: {
      articles: articlesSchema,
    },
    required: ["articles"],
  },
  output_parameters: {
    properties: {
      articles: articlesSchema,
    },
    required: ["articles"],
  },
});

export default SlackFunction(
  FilterDatastoreArticlesFunction,
  async ({ inputs, client }) => {
    const { articles } = inputs;
    const filteredArticles = [];

    for (const article of articles) {
      // Check if the article title already exists in the datastore
      const existingArticle = await client.apps.datastore.get({
        datastore: ArticleDatastore.name,
        id: { title: article.title },
      });

      if (existingArticle.ok && existingArticle.item) {
        console.log(`Article with title "${article.title}" already exists.`);
        continue; // Skip if the article already exists
      }

      // If the article does not exist in the datastore, add it to the filtered list
      filteredArticles.push(article);
    }

    return {
      outputs: {
        articles: filteredArticles,
      },
    };
  },
);
