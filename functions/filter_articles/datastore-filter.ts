import { ArticleDatastore } from "../../datastores/article-datastore.ts";
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const FilterDatastoreArticlesFunction = DefineFunction({
  callback_id: "filter_articles_function",
  title: "Filter Articles",
  description: "Filters articles based on uniqueness and relevance score",
  source_file: "functions/article.ts",
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
