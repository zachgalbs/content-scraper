export async function scoreRelevance(
  sourceUrl: string,
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
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content:
              `Rate the relevance of the following source on a scale from 1 to 100 based on its relevance to AI, machine learning, and native development. Provide the score followed by a brief explanation, separated by a pipe character (|). Example format: "85|High relevance due to focus on ML algorithms": ${sourceUrl}`,
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

    // Validate the score
    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 100) {
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
    console.error("Error in scoreRelevance:", error);
    throw error;
  }
}
