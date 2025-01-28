// filter-relevance.ts

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

    // Limit concurrency to 5 articles at a time
    const limit = pLimit(5);

    // Build an array of Promises for scoring articles
    const scoringPromises = articles.map((article, idx) =>
      limit(async () => {
        const articleStart = performance.now();

        try {
          // Score the article (ALWAYS set score, even if below threshold)
          const { score, explanation } = await scoreRelevance(article.fullText);
          const articleEnd = performance.now();

          // Assign the score and explanation for all articles
          article.score = score;
          article.explanation = explanation;

          console.log(
            `[FilterRelevantArticles] Article #${
              idx + 1
            } "${article.title}" from ${article.source} scored in ${
              (articleEnd - articleStart).toFixed(2)
            } ms. Score = ${score}`,
          );

          // Return the article if relevant; otherwise null
          return score > 50 ? article : null;
        } catch (error) {
          console.log("Article text length:", article.fullText.length);
          console.error(
            `[FilterRelevantArticles] Error scoring article "${article.title}" from ${article.source}:`,
            error,
          );
          return null; // skip or handle differently
        }
      })
    );

    // Wait for all scoring operations to finish
    const scoredResults = await Promise.all(scoringPromises);

    // Filter out any nulls (i.e. articles under the threshold or error'd out)
    const relevantArticles = scoredResults.filter(Boolean) as typeof articles;

    // --- Summation of scores by source ---
    // Track every article's score, no matter its threshold
    const sourceScores: { [source: string]: number } = {};

    // Populate all sources with a default score of 0
    for (const article of articles) {
      if (article.source && !(article.source in sourceScores)) {
        sourceScores[article.source] = 0;
      }
    }

    // Accumulate scores for all articles (yes, even the ones that didn't make the cut)
    for (const article of articles) {
      if (article.source) {
        sourceScores[article.source] += article.score ?? 0;
      }
    }

    // Log the total scores for each source
    for (const [source, totalScore] of Object.entries(sourceScores)) {
      console.log(
        `[FilterRelevantArticles] ${source} total score: ${totalScore}`,
      );
    }

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
