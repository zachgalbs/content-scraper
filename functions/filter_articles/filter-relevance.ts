import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import { scoreRelevance } from "./score-relevance.ts";
import { ArticleType } from "../other/article-type-definition.ts";
import { Schema } from "deno-slack-sdk/mod.ts";

export const FilterRelevantArticlesFunction = DefineFunction({
  callback_id: "filter_relevant_articles_function",
  title: "Filter Relevant Articles",
  description: "Filters articles based on relevance score",
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

export default SlackFunction(
  FilterRelevantArticlesFunction,
  async ({ inputs }) => {
    const { articles } = inputs;
    const relevantArticles = [];

    // check if the articles array is empty (via checking if the first article has no title)
    if (!articles[0]?.title) {
      return {
        outputs: {
          articles: [],
        },
      };
    }

    for (const article of articles) {
      try {
        const { score, explanation } = await scoreRelevance(article.fullText);

        if (score > 50) {
          article.score = score;
          article.explanation = explanation;
          relevantArticles.push(article);
          console.log(
            `Article with title "${article.title}" is relevant`,
          );
        }
      } catch (error) {
        console.log("Article text:", article.fullText);
        console.log("Article length:", article.fullText.length);
        console.error("Error scoring article:", error);
      }
    }

    return {
      outputs: {
        articles: relevantArticles,
      },
    };
  },
);
