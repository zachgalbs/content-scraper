import { NEWS_SOURCES } from "../../news-sources.ts";
import { parseRSSFeed } from "../other/parse-rss.ts";

// should return the 3 latest articles from each source
export async function getLatestArticles() {
  const allArticles = [];

  for (const source of NEWS_SOURCES) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const articles = parseRSSFeed(xmlText, source.name);

      // Sort articles by date for the current source
      articles.sort((a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );

      // Get the 3 latest articles from the current source
      const latestArticles = articles.slice(0, 3);
      allArticles.push(...latestArticles); // Collect the latest articles from source
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
    }
  }

  return allArticles;
}
