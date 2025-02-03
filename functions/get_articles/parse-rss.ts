import { XMLParser } from "npm:fast-xml-parser";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";
import { Readability } from "npm:@mozilla/readability";
import pLimit from "npm:p-limit";

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

const limit = pLimit(5);
// 4. The revised RSS parsing function (async) using Readability where necessary
export async function ParseRSSFeedFunction(
  xmlText: string,
  sourceName: string,
  sourceUrl: string,
) {
  const parser = new XMLParser();
  const jObj = parser.parse(xmlText);
  const items = extractFeedItems(jObj);
  const sourceRootDomain = getRootDomain(sourceUrl);

  // Build a list of promises to fetch article HTML in parallel, but with concurrency = 3
  const itemPromises = items.map((item) =>
    limit(async () => {
      try {
        // Extract fields
        const title = item.title || "";
        const link = typeof item.link === "string"
          ? item.link
          : item.link?.["@_href"] || "";
        const pubDate = item.pubDate || item.published || "";
        const creator = item["dc:creator"] || item.author?.name ||
          "Unknown Author";

        // If domain doesn't match, skip
        const linkRootDomain = getRootDomain(link);
        if (sourceRootDomain !== linkRootDomain) {
          return null; // skip
        }

        // Pass the allowed domain to fetchWithTimeout
        const articleHTML = await fetchWithTimeout(
          link.trim(), 
          8_000,
          sourceRootDomain
        );
        
        let articleText = "";
        if (articleHTML.ok) {
          const text = await articleHTML.text();
          articleText = parseArticleWithReadability(text);
        }

        return {
          title: decodeXMLEntities(title.trim()),
          source: sourceName,
          link: link.trim(),
          pubDate,
          creator: decodeXMLEntities(creator.trim()),
          fullText: decodeXMLEntities(articleText),
          summary: "",
          score: 0,
          explanation: "",
        };
      } catch (error) {
        console.error(`Error fetching/processing item:`, error);
        return null;
      }
    })
  );

  // Wait for all items to be processed
  const fetchedArticles = await Promise.all(itemPromises);

  // Filter out any null results
  return fetchedArticles.filter(Boolean);
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

  // Convert to array and limit to first 3 items
  const itemsArray = Array.isArray(items)
    ? items as FeedItem[]
    : items
    ? [items as FeedItem]
    : [];

  // Sort by date before slicing to get the most recent items
  itemsArray.sort((a, b) => {
    const dateA = new Date(a.pubDate || a.published || "").getTime();
    const dateB = new Date(b.pubDate || b.published || "").getTime();
    if (isNaN(dateA) || isNaN(dateB)) return 0;
    return dateB - dateA; // descending
  });

  return itemsArray.slice(0, 2); // Only process the 2 most recent items
}

/**
 * A helper to wrap `fetch` with a timeout using `AbortController`.
 * Now includes domain validation to prevent unwanted requests.
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs = 10_000, // 10s timeout, adjust as needed
  allowedDomain?: string, // Optional parameter for allowed domain
): Promise<Response> {
  // Validate URL domain if allowedDomain is provided
  if (allowedDomain) {
    const urlDomain = getRootDomain(url);
    if (urlDomain !== allowedDomain) {
      throw new Error(`Domain ${urlDomain} does not match allowed domain ${allowedDomain}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        // Prevent loading images and other resources
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain',
      }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
