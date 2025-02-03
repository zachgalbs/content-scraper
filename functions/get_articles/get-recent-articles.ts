import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";
import { ParseRSSFeedFunction } from "./parse-rss.ts";
import { NEWS_SOURCES } from "../../news-sources.ts";
import { fetchWithTimeout } from "./parse-rss.ts";

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
    const allStart = performance.now();
    console.log("[INFO] Starting parallel fetch of RSS sources...");

    // 1. Fetch all RSS feeds in parallel with Promise.all
    //    This creates an array of Promises, one for each source.
    const fetchPromises = NEWS_SOURCES.map(async (source) => {
      const sourceStart = performance.now();
      console.log(`[INFO] [${source.name}] Start fetching...`);

      try {
        // -- Timed fetch for the RSS feed
        const response = await fetchWithTimeout(source.url, 8_000); // 8s per feed
        if (!response.ok) {
          console.error(
            `[ERROR] [${source.name}] HTTP status: ${response.status}`,
          );
          return [];
        }

        const fetchEnd = performance.now();
        console.log(
          `[INFO] [${source.name}] Fetched in ${
            (fetchEnd - sourceStart).toFixed(2)
          } ms. Parsing feed...`,
        );

        // -- Get the XML text
        const xmlText = await response.text();

        // -- Parse the feed to extract articles (which may also fetch article HTML in parallel)
        const parseStart = performance.now();
        const articles = await ParseRSSFeedFunction(
          xmlText,
          source.name,
          source.url,
        );
        const parseEnd = performance.now();
        console.log(
          `[INFO] [${source.name}] Parsed feed in ${
            (parseEnd - parseStart).toFixed(2)
          } ms (${articles.length} articles found).`,
        );

        // Sort articles by date
        articles.sort((a, b) => {
          if (a === null || b === null) return 0; // treat null as equal
          const dateA = new Date(a.pubDate).getTime();
          const dateB = new Date(b.pubDate).getTime();
          if (isNaN(dateA) || isNaN(dateB)) return 0; // treat invalid as equal
          return dateB - dateA; // descending
        });

        // Return only the first 3 from each source
        const topArticles = articles.slice(0, 1);

        console.log(
          `[INFO] [${source.name}] Completed. Returning ${topArticles.length} articles.`,
        );
        return topArticles;
      } catch (error) {
        console.error(`[ERROR] [${source.name}]`, error);
        return [];
      }
    });

    // Wait for all fetch/parse operations to finish
    const results = await Promise.all(fetchPromises);

    // Flatten the arrays from each source and filter out null values
    const allArticles = results.flat().filter((
      article,
    ): article is NonNullable<typeof article> => article !== null);
    const allEnd = performance.now();
    console.log(
      `[INFO] All sources fetched and parsed in ${
        (allEnd - allStart).toFixed(2)
      } ms. Total articles: ${allArticles.length}.`,
    );

    // Return the combined articles
    return {
      outputs: {
        articles: allArticles,
      },
    };
  },
);
