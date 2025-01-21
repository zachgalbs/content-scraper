import { decodeXMLEntities } from "./parse-rss.ts";
// Function to fetch and parse full text of an article from XML
export async function fetchFullText(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch full text: ${response.statusText}`);
    }
    const xmlText = await response.text();

    // Use a similar approach to parse the XML and extract the full text
    const contentMatch = xmlText.match(
      /<content:encoded>(?:<!\[CDATA\[(.*?)\]\]>)?(.*?)<\/content:encoded>/,
    );
    const fullText = contentMatch ? (contentMatch[1] || contentMatch[2]) : "";

    return decodeXMLEntities(fullText);
  } catch (error) {
    console.error("Error fetching full text:", error);
    return "";
  }
}
