export async function scoreRelevance(
  fullText: string,
): Promise<{ score: number; explanation: string }> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  // Check input length and log for clarity
  if (!fullText || fullText.trim().length === 0) {
    throw new Error("Empty or invalid fullText provided.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use a valid model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content:
              `Rate the relevance of the following text on a scale from 1 to 100 based on its relevance to AI, machine learning, and native development. Provide the score followed by a brief explanation, separated by a pipe character (|). Example format: "85|High relevance due to focus on ML algorithms": ${fullText}`,
          },
        ],
        max_tokens: 200, // Increased to accommodate longer explanations
        temperature: 0.1, // Low temperature for consistent responses
      }),
    });

    // Check response status before parsing body
    if (!response.ok) {
      console.error(
        `OpenAI API error. Status: ${response.status}. Body: ${await response
          .text()}`,
      );
      throw new Error(
        `OpenAI API returned an error: ${response.status}. Check logs for details.`,
      );
    }

    const responseText = await response.text();
    const data = JSON.parse(responseText);

    // Extract score and explanation from the response
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

    return {
      score: parsedScore,
      explanation: explanation?.trim() || "No explanation provided.",
    };
  } catch (error) {
    console.error("Error in scoreRelevance function:", error, {
      fullTextLength: fullText.length,
    });
    throw error; // Rethrow error after logging
  }
}
