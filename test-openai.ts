const API_KEY = Deno.env.get("OPENAI_API_KEY");

async function testOpenAI() {
  console.log("Testing OpenAI API connection...");
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'OpenAI API is working!'" }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API request failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log("API Response:", data.choices[0]?.message?.content);
    console.log("API test successful!");
  } catch (error) {
    console.error("API test failed:", error);
  }
}

testOpenAI();
