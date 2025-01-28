import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";
import { ParseRSSFeedFunction } from "./parse-rss.ts";
import { NEWS_SOURCES } from "../../news-sources.ts";

export const GetLatestArticlesFunction = DefineFunction({
  callback_id: "get_latest_articles_function",
  title: "Get Latest Articles",
  description: "Fetches the latest articles from news sources",
  source_file: "functions/get_articles/get-recent-articles.ts",
  input_parameters: {
    properties: {}, // No input parameters needed
    required: [],
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
  GetLatestArticlesFunction,
  async () => {
    const allArticles = [];

    for (const source of NEWS_SOURCES) {
      try {
        const response = await fetch(source.url);
        if (!response.ok) {
          console.error(
            `HTTP error fetching ${source.name}: ${response.status}`,
          );
          continue; // Skip this source if there's an error
        }

        const xmlText = await response.text();
        // FIX #1: ParseRSSFeedFunction is async, so we must await it
        const articles = await ParseRSSFeedFunction(xmlText, source.url);

        // Sort articles by date for the current source
        articles.sort((a, b) => {
          const dateA = new Date(a.pubDate).getTime();
          const dateB = new Date(b.pubDate).getTime();

          if (isNaN(dateA) || isNaN(dateB)) {
            console.error(
              `Invalid date encountered: ${a.pubDate} or ${b.pubDate}`,
            );
            return 0; // Treat invalid dates as equal
          }

          // Descending order: newer articles first
          return dateB - dateA;
        });

        // Fetch HTML for the first 3 articles
        const latestArticles = articles.slice(0, 3);
        allArticles.push(...latestArticles);
      } catch (error) {
        console.error(`Error fetching articles from ${source.name}:`, error);
      }
    }

    // Return articles in Slack Function's outputs format
    return {
      outputs: {
        articles: allArticles,
      },
    };
  },
);
