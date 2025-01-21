export function parseRSSFeed(xmlText: string, sourceName: string) {
  // Basic XML parsing using string operations (you might want to use a proper XML parser)
  const articles = [];
  const items = xmlText.split("<item>");
  console.log(items.length);

  // Skip the first split as it's the header
  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // Extract title, handling CDATA
    const titleMatch = item.match(
      /<title>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/title>/,
    );
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : "";

    // Extract link, handling CDATA
    const linkMatch = item.match(
      /<link>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/link>/,
    );
    const link = linkMatch ? (linkMatch[1] || linkMatch[2]) : "";

    // Extract publication date
    const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = dateMatch ? dateMatch[1] : "";

    // Extract author/creator, handling CDATA
    const creatorMatch = item.match(
      /<dc:creator>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/dc:creator>/,
    );
    const creator = creatorMatch
      ? (creatorMatch[1] || creatorMatch[2])
      : "Unknown Author";

    articles.push({
      title: decodeXMLEntities(title),
      source: sourceName, // Add the source name to the article
      link,
      pubDate,
      creator: decodeXMLEntities(creator),
      summary: "", // Initialize summary as an empty string
      score: 0, // Initialize score as 0
      explanation: "", // Initialize explanation as an empty string
    });
  }

  return articles;
}

export function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
