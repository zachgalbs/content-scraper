import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import pLimit from "npm:p-limit"; // concurrency limiter
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
    const startTime = performance.now();

    // check if articles array is empty or invalid
    if (!articles || articles.length === 0 || !articles[0]?.title) {
      console.log("[FilterRelevantArticles] No valid articles to process.");
      return {
        outputs: {
          articles: [],
        },
      };
    }

    console.log(
      `[FilterRelevantArticles] Received ${articles.length} articles.`,
    );

    // Option 1: Let each scoreRelevance handle concurrency
    // Option 2: We add concurrency limiting here too, to limit total concurrency
    const limit = pLimit(5); // Up to 5 articles at once

    // Build an array of Promises for scoring articles
    const scoringPromises = articles.map((article, idx) =>
      limit(async () => {
        const articleStart = performance.now();

        // Attempt to score the article
        try {
          const { score, explanation } = await scoreRelevance(article.fullText);
          const articleEnd = performance.now();

          console.log(
            `[FilterRelevantArticles] Article #${
              idx + 1
            } "${article.title}" scored in ${
              (articleEnd - articleStart).toFixed(2)
            } ms. Score = ${score}`,
          );

          if (score > 50) {
            article.score = score;
            article.explanation = explanation;
            return article; // relevant
          }
          // Not relevant
          return null;
        } catch (error) {
          console.log("Article text length:", article.fullText.length);
          console.error(
            `[FilterRelevantArticles] Error scoring article #${idx + 1}:`,
            error,
          );
          return null; // skip or handle differently
        }
      })
    );

    // Wait for all scoring operations to finish
    const scoredResults = await Promise.all(scoringPromises);

    // Filter out any nulls (articles under score threshold or error'd out)
    const relevantArticles = scoredResults.filter(Boolean) as typeof articles;

    const endTime = performance.now();
    console.log(
      `[FilterRelevantArticles] Completed filtering in ${
        (endTime - startTime).toFixed(2)
      } ms. Found ${relevantArticles.length} relevant articles.`,
    );

    return {
      outputs: {
        articles: relevantArticles,
      },
    };
  },
);
