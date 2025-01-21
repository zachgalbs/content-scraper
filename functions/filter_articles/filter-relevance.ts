import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import { scoreRelevance } from "../other/score-relevance.ts";
import { fetchFullText } from "../other/fetch-full-text.ts";
import { articlesSchema } from "../other/article-definition.ts";
export const FilterRelevantArticlesFunction = DefineFunction({
  callback_id: "filter_relevant_articles_function",
  title: "Filter Relevant Articles",
  description: "Filters articles based on relevance score",
  source_file: "functions/filter_articles/filter-relevance.ts",
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
