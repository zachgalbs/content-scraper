import { XMLParser } from "npm:fast-xml-parser";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";
import { Readability } from "npm:@mozilla/readability";

// 1. Utility function to fetch the full HTML of an article using the link
async function fetchArticleHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch article HTML. Status: ${response.status}`);
      return "";
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching HTML from ${url}:`, error);
    return "";
  }
}

// 2. Updated function using Deno's DOMParser
function parseArticleWithReadability(htmlContent: string): string {
  try {
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML document");
    }

    const reader = new Readability(doc);
    const article = reader.parse();

    if (article?.textContent && article.textContent.length > 5) {
      return article.textContent;
    }

    console.error("READABILITY FAILED TO PARSE THE ARTICLE.");
    return "";
  } catch (error) {
    console.error("Error parsing article content:", error);
    return "";
  }
}

// 3. Decode XML entities from RSS fields (unchanged)
export function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Curly single quotes (’ ‘) -> '
    .replace(/&#8216;/g, "'") // left single quote
    .replace(/&#8217;/g, "'") // right single quote
    // Curly double quotes (""") -> "
    .replace(/&#8220;/g, '"') // left double quote
    .replace(/&#8221;/g, '"') // right double quote
    // Dashes & Ellipsis
    .replace(/&#8211;/g, "-") // en dash
    .replace(/&#8212;/g, "--") // em dash
    .replace(/&#8230;/g, "..."); // ellipsis
}

// 4. The revised RSS parsing function (async) using Readability where necessary
export async function ParseRSSFeedFunction(
  xmlText: string,
  sourceName: string,
) {
  const articles = [];
  const parser = new XMLParser();
  const jObj = parser.parse(xmlText);
  const items = extractFeedItems(jObj);

  for (const item of items) {
    // Access parsed XML properties directly
    const title = item.title || "";
    const link = typeof item.link === "string"
      ? item.link
      : item.link?.["@_href"] || "";
    const pubDate = item.pubDate || item.published || "";
    const creator = item["dc:creator"] || item.author?.name || "Unknown Author";

    // Domain check to decide whether to fetch the full article HTML
    const sourceRootDomain = getRootDomain(sourceName);
    const linkRootDomain = getRootDomain(link);

    let articleText = "";
    if (sourceRootDomain === linkRootDomain) {
      try {
        const articleHTML = await fetchArticleHtml(link.trim());
        if (articleHTML) {
          // Extract the main text content from the full HTML using Readability
          articleText = parseArticleWithReadability(articleHTML);
        }
      } catch (error) {
        console.error(`Error fetching HTML from ${link}:`, error);
      }
    } else {
      console.log(
        `Skipping link: ${link} (does not match source: ${sourceRootDomain})`,
      );
      // end interation of loop
      break;
    }

    // Store the article data
    articles.push({
      title: decodeXMLEntities(title.trim()),
      source: sourceName,
      link: link.trim(),
      pubDate,
      creator: decodeXMLEntities(creator.trim()),
      fullText: decodeXMLEntities(articleText),
      summary: "",
      score: 0,
      explanation: "",
    });
  }

  return articles;
}

// Helper function to get the root domain of a URL
function getRootDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname; // e.g. feed.infoq.com
    const parts = hostname.split(".");
    return parts.slice(-2).join("."); // e.g. infoq.com
  } catch {
    console.error("Invalid URL for getRootDomain:", url);
    return "";
  }
}

// Keep the interface definitions from previous answer
interface RssFeed {
  rss?: {
    channel?: {
      item?: unknown | unknown[];
    };
  };
}

interface AtomFeed {
  feed?: {
    entry?: unknown | unknown[];
  };
}

// Add type definition for feed items
interface FeedItem {
  title?: string;
  link?: string | { "@_href": string }; // Atom links are objects
  pubDate?: string;
  published?: string; // Atom uses "published"
  "dc:creator"?: string;
  author?: { name?: string }; // Atom author format
  summary?: string;
  content?: string;
}

// Updated implementation using parsed XML structure
function extractFeedItems(parsedData: RssFeed | AtomFeed): FeedItem[] {
  const items = "rss" in parsedData
    ? parsedData.rss?.channel?.item
    : "feed" in parsedData
    ? parsedData.feed?.entry
    : undefined;

  return Array.isArray(items)
    ? items as FeedItem[]
    : items
    ? [items as FeedItem]
    : [];
}
