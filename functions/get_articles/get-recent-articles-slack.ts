import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";
import { ParseRSSFeedFunction } from "./parse-rss.ts";
import { NEWS_SOURCES } from "../../news-sources.ts";

export const GetLatestArticlesSlackFunction = DefineFunction({
  callback_id: "get_latest_articles_function",
  title: "Get Latest Articles",
  description: "Fetches the latest articles from news sources",
  source_file: "functions/get_articles/get-recent-articles-slack.ts",
  input_parameters: {
    properties: {}, // No input parameters needed in this case
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
  GetLatestArticlesSlackFunction,
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
        const articles = ParseRSSFeedFunction(xmlText, source.url);

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

          return dateB - dateA;
        });

        // Get the 3 latest articles from the current source
        const latestArticles = articles.slice(0, 1);
        allArticles.push(...latestArticles); // Collect the latest articles from source
      } catch (error) {
        console.error(`Error fetching articles from ${source.name}:`, error);
      }
    }

    // Return articles in Slack Function's outputs format
    return {
      outputs: {
        articles: allArticles, // Output the collected articles
      },
    };
  },
);
