import { NEWS_SOURCES } from "../news-sources.ts";

export async function getArticleInfo() {
  try {
    const articles = await fetchLatestArticles();
    return articles.map((article) => ({
      title: article.title,
      creator: article.creator,
      link: article.link,
      summary: article.summary,
      source: article.source,
    }));
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export default getArticleInfo;

async function summarizeText(text: string): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Updated model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content:
              `Please go over the following article and summarize it. Please keep the response to a maximum of 30 words: ${text}`,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    const responseText = await response.text(); // Get raw response first

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${responseText}`);
    }

    const data = JSON.parse(responseText);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error in summarizeText:", error);
    throw error;
  }
}

export async function scoreRelevance(
  text: string,
): Promise<{ score: number; explanation: string }> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content:
              `Rate the following article on a scale from 1 to 100 based on the relevance to AI, machine learning, and native development. Provide the score followed by a brief explanation, separated by a pipe character (|). Example format: "85|High relevance due to focus on ML algorithms": ${text}`,
          },
        ],
        max_tokens: 100, // Increased to accommodate explanation
        temperature: 0.1,
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const [score, explanation] = data.choices[0].message.content.trim().split(
      "|",
    );
    return {
      score: parseInt(score, 10),
      explanation: explanation || "No explanation provided",
    };
  } catch (error) {
    console.error("Error in scoreRelevance:", error);
    throw error;
  }
}

export async function fetchLatestArticles() {
  const allArticles = [];

  for (const source of NEWS_SOURCES) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const articles = parseRSSFeed(xmlText, source.name);

      // Summarize each article
      for (const article of articles) {
        try {
          article.summary = await summarizeText(
            `${article.title} ${article.link}`,
          );
        } catch (summaryError) {
          console.error("Error summarizing article:", summaryError);
          article.summary = "Summary not available.";
        }
      }

      allArticles.push(...articles); // Collect articles from all sources
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
    }
  }

  // Sort all articles by date and return the most recent ones
  return allArticles
    .sort((a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
}

function parseRSSFeed(xmlText: string, sourceName: string) {
  // Basic XML parsing using string operations (you might want to use a proper XML parser)
  const articles = [];
  const items = xmlText.split("<item>");

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
      link,
      pubDate,
      creator: decodeXMLEntities(creator),
      summary: "", // Initialize summary as an empty string
      source: sourceName, // Add the source name to the article
    });
  }

  return articles.slice(0, 1); // Return only the most recent article
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
