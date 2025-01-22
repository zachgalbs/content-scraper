import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import summarizeText from "../other/summarize-text.ts";
import { ArticleType } from "../other/article-type-definition.ts";

// Define the Slack Function
export const SummarizeArticlesFunction = DefineFunction({
  callback_id: "summarize_articles",
  title: "Summarize Articles",
  description: "Summarizes a list of articles",
  source_file: "functions/return_articles/summarize-articles.ts",
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

// Implement the Slack Function
export default SlackFunction(
  SummarizeArticlesFunction,
  async ({ inputs }) => {
    const { articles } = inputs;

    // check if the articles array is empty (via checking if the first article has no title)
    if (!articles[0]?.title) {
      return {
        outputs: {
          articles: [],
        },
      };
    }

    const summarizedArticles = [];

    for (const article of articles) {
      try {
        // Summarize the article
        article.summary = await summarizeText(article.link);
      } catch (summaryError) {
        console.error("Error summarizing article:", summaryError);
        article.summary = "Summary not available.";
      }

      summarizedArticles.push(article);
    }

    return {
      outputs: {
        articles: summarizedArticles,
      },
    };
  },
);
