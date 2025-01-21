import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { scoreRelevance } from "../other/score-relevance.ts";
import { fetchFullText } from "../other/fetch-full-text.ts";

export const FilterRelevantArticlesFunction = DefineFunction({
  callback_id: "filter_relevant_articles_function",
  title: "Filter Relevant Articles",
  description: "Filters articles based on relevance score",
  source_file: "functions/filter_articles/slack-filter-relevance.ts",
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
          required: ["title", "summary"],
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
          required: ["title", "summary", "score", "explanation"],
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

    for (const article of articles) {
      try {
        const fullText = await fetchFullText(article.link);

        const { score, explanation } = await scoreRelevance(fullText);

        if (score > 50) {
          article.score = score;
          article.explanation = explanation;
          relevantArticles.push(article);
        }
      } catch (error) {
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
