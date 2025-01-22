export default async function summarizeText(url: string): Promise<string> {
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
        model: "gpt-3.5-turbo", // Updated model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content:
              `Please go over the following article and summarize it. Please keep the response to a maximum of 30 words: ${url}`,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    const responseText = await response.text(); // Get raw response first

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${responseText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = JSON.parse(responseText);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error in summarizeText:", error);
    throw error;
  }
}
