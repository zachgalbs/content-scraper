import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import summarizeText from "../other/summarize-text.ts";
import { fetchFullText } from "../other/fetch-full-text.ts";

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
          type: Schema.types.object,
          properties: {
            link: { type: Schema.types.string },
          },
          required: ["link"],
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

// Implement the Slack Function
export default SlackFunction(
  SummarizeArticlesFunction,
  async ({ inputs }) => {
    const { articles } = inputs;
    const summarizedArticles = [];

    for (const article of articles) {
      try {
        const fullText = await fetchFullText(article.link);
        // Summarize the article
        article.summary = await summarizeText(fullText);
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
