import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import { scoreRelevance } from "../other/score-relevance.ts";
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
        const { score, explanation } = await scoreRelevance(article.link);

        console.log(
          `Score for article "${article.title}" from "${article.link}": ${score}`,
        );

        if (score > 50) {
          article.score = score;
          article.explanation = explanation;
          relevantArticles.push(article);
          console.log("Article added to relevantArticles:", article.title);
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
