// score-relevance.ts
import pLimit from "npm:p-limit"; // optional concurrency-limiter if you want at the "score" level

// Create a limit for concurrency at the scoring function level (optional)
const limit = pLimit(3); // Only 3 simultaneous calls to the OpenAI API

export async function scoreRelevance(
  fullText: string,
): Promise<{ score: number; explanation: string }> {
  // Wrap the entire scoring logic in limit(...) if you want to cap concurrency
  return limit(async () => {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("OpenAI API key is not set in environment variables.");
    }

    // Pre-check the input
    if (!fullText || fullText.trim().length === 0) {
      throw new Error("Empty or invalid fullText provided.");
    }

    // Mark start time for performance
    const startTime = performance.now();

    // Truncate the text to a manageable size to reduce API load
    const truncatedText = fullText.slice(0, 1000); // Adjust length as needed
    const requestBody = JSON.stringify({
      model: "gpt-4o-mini", // Suppose this is a valid model on your side
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content:
            `Rate the relevance of the following text on a scale from 1 to 100 based on its relevance to AI, machine learning, and native development. Provide the score followed by a brief explanation, separated by a pipe character (|). Example format: "85|High relevance due to focus on ML algorithms": ${truncatedText}`,
        },
      ],
      max_tokens: 150, // Limit tokens to speed up response
      temperature: 0.1, // Keep temperature low for consistent results
    });

    // Create a timeout controller
    const controller = new AbortController();
    const timeoutMs = 10_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // 10s timeout

    try {
      console.log(
        `[scoreRelevance] Starting fetch to OpenAI (timeout: ${timeoutMs}ms)`,
      );
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: requestBody,
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`OpenAI API error. Status: ${response.status}`);
        const errorBody = await response.text();
        console.error(`Error body: ${errorBody}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      // Parse response as JSON
      const data = await response.json();

      // Extract score and explanation
      const [score, explanation] = data.choices[0].message.content
        .trim()
        .split("|");

      // Validate the score
      const parsedScore = parseInt(score, 10);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
        console.warn("Invalid score received:", score);
        return {
          score: 0,
          explanation: "Invalid score received from the AI.",
        };
      }

      const endTime = performance.now();
      console.log(
        `[scoreRelevance] Completed in ${
          (endTime - startTime).toFixed(2)
        } ms. Score: ${parsedScore}`,
      );

      return {
        score: parsedScore,
        explanation: explanation?.trim() || "No explanation provided.",
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error("OpenAI API request timed out.");
        } else {
          console.error("Error in scoreRelevance function:", error.message);
        }
      } else {
        console.error("An unknown error occurred:", error);
      }
      throw error; // Rethrow after logging
    }
  });
}
