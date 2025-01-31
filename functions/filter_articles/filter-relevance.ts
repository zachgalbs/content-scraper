import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";
// Define the Slack function
export const FilterRelevantArticlesFunction = DefineFunction({
  callback_id: "filter_relevant_articles",
  title: "Filter Relevant Articles",
  description: "Filters articles with a score above 50",
  source_file: "functions/filter_articles/filter-relevance.ts",
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

// Implement the Slack function
export default SlackFunction(
  FilterRelevantArticlesFunction,
  ({ inputs }) => {
    const { articles } = inputs;

    // Filter articles with a score above 50
    const filteredArticles = articles.filter(
      (article) => article.score !== undefined && article.score > 50,
    );

    return {
      outputs: {
        articles: filteredArticles,
      },
    };
  },
);
