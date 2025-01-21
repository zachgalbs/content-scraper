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
