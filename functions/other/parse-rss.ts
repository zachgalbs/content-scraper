export function parseRSSFeed(xmlText: string, sourceName: string) {
  const articles = [];
  // Split on <item> tags to isolate article items
  const items = xmlText.split("<item>");

  // Skip index 0 (feed header) and parse each <item> block
  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // 1. Title
    const titleMatch = item.match(
      /<title>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/title>/,
    );
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : "";

    // 2. Link
    const linkMatch = item.match(
      /<link>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/link>/,
    );
    const link = linkMatch ? (linkMatch[1] || linkMatch[2]) : "";

    // 3. Publication Date
    const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = dateMatch ? dateMatch[1].trim() : "";

    // 4. Creator/Author
    const creatorMatch = item.match(
      /<dc:creator>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/dc:creator>/,
    );
    const creator = creatorMatch
      ? (creatorMatch[1] || creatorMatch[2])
      : "Unknown Author";

    // 5. Store parsed article data
    articles.push({
      title: decodeXMLEntities(title.trim()),
      source: sourceName, // The name of the RSS source
      link: link.trim(),
      pubDate,
      creator: decodeXMLEntities(creator.trim()),
      summary: "", // Placeholder, in case you summarize later
      score: 0, // Placeholder for any scoring logic
      explanation: "", // Placeholder for explanation text
    });
  }

  return articles;
}

export function getFullTextFromItem(item: string): string {
  // 1. Attempt to match <content:encoded> (including optional CDATA)
  const contentMatch = item.match(
    /<content:encoded>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/content:encoded>/,
  );
  if (contentMatch) {
    // Either group #1 (CDATA content) or group #2 (regular text)
    const rawContent = contentMatch[1] || contentMatch[2] || "";
    return decodeXMLEntities(rawContent.trim());
  }

  // 2. Fallback: try <description> if <content:encoded> wasn't found
  //   (some RSS feeds only provide summaries in <description>)
  const descMatch = item.match(
    /<description>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/description>/,
  );
  if (descMatch) {
    const rawDesc = descMatch[1] || descMatch[2] || "";
    return decodeXMLEntities(rawDesc.trim());
  }

  // 3. No content found
  return "";
}

export function decodeXMLEntities(text: string): string {
  return text
    // Standard named HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Curly single quotes (’ ‘) -> '
    .replace(/&#8216;/g, "'") // left single quote
    .replace(/&#8217;/g, "'") // right single quote
    // Curly double quotes (“ ”) -> "
    .replace(/&#8220;/g, '"') // left double quote
    .replace(/&#8221;/g, '"') // right double quote
    // Dashes & Ellipsis
    .replace(/&#8211;/g, "-") // en dash
    .replace(/&#8212;/g, "--") // em dash
    .replace(/&#8230;/g, "..."); // ellipsis
}
