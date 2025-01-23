function fetchArticleText(xmlText: string) {
  try {
    // 2. Remove <script> and <style> blocks entirely to reduce noise
    let cleanedXml = xmlText.replace(/<script[\s\S]*?<\/script>/gi, "");
    cleanedXml = cleanedXml.replace(/<style[\s\S]*?<\/style>/gi, "");

    // 3. Potential matches for "main content"
    //    We'll gather candidates, then pick the one with the most text.
    const candidates = [];

    // --- A) <article> ---
    const articleMatch = cleanedXml.match(
      /<article.*?>([\s\S]*?)<\/article>/i,
    );
    if (articleMatch?.[1]) candidates.push(articleMatch[1]);

    // --- B) <main> ---
    const mainMatch = cleanedXml.match(/<main.*?>([\s\S]*?)<\/main>/i);
    if (mainMatch?.[1]) candidates.push(mainMatch[1]);

    // --- C) Common class or ID selectors for main content in <div> ---
    // (like .post-content, .entry-content, .article-body, etc.)
    const divPatterns = [
      /<div[^>]+class=["'][^"']*(?:post-content|entry-content|article-body|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]+id=["'][^"']*(?:post-content|entry-content|article-body|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ];

    for (const pattern of divPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(cleanedXml))) {
        if (match[1]) candidates.push(match[1]);
      }
    }

    // --- D) If no candidate found, fallback to <body> ---
    let bodyContent = "";
    const bodyMatch = cleanedXml.match(/<body.*?>([\s\S]*?)<\/body>/i);
    if (bodyMatch?.[1]) {
      bodyContent = bodyMatch[1];
    } else {
      // If there's no <body>, fallback to the entire XML text
      bodyContent = cleanedXml;
    }
    if (!candidates.length) {
      candidates.push(bodyContent);
    }

    // 4. Find the candidate block with the largest amount of text
    let bestBlock = candidates.reduce((prev, current) => {
      // Compare lengths of text content after removing tags
      const prevTextLen = prev.replace(/<[^>]+>/g, "").trim().length;
      const currentTextLen = current.replace(/<[^>]+>/g, "").trim().length;
      return currentTextLen > prevTextLen ? current : prev;
    });

    // 5. Clean up HTML tags (from the best block)
    //    And collapse multiple spaces to a single space.
    bestBlock = bestBlock
      .replace(/<[^>]+>/g, "") // Remove all HTML tags
      .replace(/\s+/g, " ") // Collapse consecutive whitespace
      .trim();

    return bestBlock;
  } catch (error) {
    console.error(`Failed to fetch article text from XML content:`, error);
    return ""; // Return empty on error
  }
}

export function ParseRSSFeedFunction(
  xmlText: string,
  sourceName: string,
) {
  const articles = [];
  const items = xmlText.split("<item>");

  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // Extract fields
    const titleMatch = item.match(
      /<title>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/title>/,
    );
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : "";

    const linkMatch = item.match(
      /<link>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/link>/,
    );
    const link = linkMatch ? (linkMatch[1] || linkMatch[2]) : "";

    const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = dateMatch ? dateMatch[1].trim() : "";

    const creatorMatch = item.match(
      /<dc:creator>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/dc:creator>/,
    );
    const creator = creatorMatch
      ? (creatorMatch[1] || creatorMatch[2])
      : "Unknown Author";

    // Fetch and preprocess article text
    const articleText = fetchArticleText(xmlText);

    // Store parsed article data
    articles.push({
      title: decodeXMLEntities(title.trim()),
      source: sourceName,
      link: link.trim(),
      pubDate: pubDate,
      creator: decodeXMLEntities(creator.trim()),
      fullText: decodeXMLEntities(articleText),
      summary: articleText.slice(0, 500) + "...",
      score: 0,
      explanation: "",
    });
  }

  return articles;
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
