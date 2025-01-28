import pLimit from "npm:p-limit"; // Concurrency limiter

// Limit the number of simultaneous API calls
const limit = pLimit(3); // Maximum 3 simultaneous OpenAI API calls

export async function scoreRelevance(
  fullText: string,
): Promise<{ score: number; explanation: string }> {
  return limit(async () => {
    // Fetch the OpenAI API key from environment variables
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key is not set in environment variables.");
    }

    // Validate input text
    if (!fullText?.trim()) {
      throw new Error("Input text is empty or invalid.");
    }

    // Mark start time for performance logging
    const startTime = performance.now();

    // Prepare the request payload
    const truncatedText = fullText.slice(0, 1000); // Limit to 1000 characters
    const requestBody = JSON.stringify({
      model: "gpt-4o-mini", // Specify the OpenAI model
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `
          **Context**

          You are assisting an AI startup team that needs to stay informed about:
          1. **Cutting-edge advancements in Artificial Intelligence (AI) and Machine Learning (ML)**.
          2. **Native Development practices** for platform-specific deployment of AI/ML (e.g., optimizing models for mobile, using APIs like Core ML or TensorFlow Lite, leveraging native hardware).

          **Task**

          Evaluate the following text based on its relevance to:
          - AI and ML topics.
          - **Native Development**, such as performance optimization, hardware integration, and platform-specific tools.

          **Scoring Guidelines**
          1. **High Relevance (70-100)**:
            - Text explicitly discusses AI/ML **in the context of native development**.
            - Mentions specific tools, frameworks, or techniques (e.g., Metal Performance Shaders, TensorFlow Lite, Core ML).
            - Addresses low-level optimizations or native deployment challenges.

          2. **Moderate Relevance (30-69)**:
            - Focuses on AI/ML broadly but lacks native development context.
            - Discusses native development topics that are **potentially applicable** to AI/ML workflows.

          3. **Low Relevance (1-29)**:
            - Does not discuss AI/ML or native development meaningfully.
            - Mentions generic AI topics without actionable insights for native implementation.

          **Input Text**

          ${truncatedText}

          **Output**

          Provide one line of output:
          - A **numeric score (1-100)**.
          - A brief **justification** for the score, focusing on the text's relevance to both AI/ML and native development.

          **Examples**
          1. 95|Detailed explanation of using TensorFlow Lite for Android inference with hardware acceleration.
          2. 40|High-level overview of machine learning concepts without native deployment details.
          3. 10|Unrelated discussion on social media algorithms.

          **Focus**
          - Prioritize **native development details** when scoring.
          - Penalize generic AI content that lacks native ties.`,
        },
      ],
      max_tokens: 150, // Limit the length of the response
      temperature: 0.1, // Encourage consistent responses
    });

    // Use AbortController to implement a request timeout
    const controller = new AbortController();
    const timeoutMs = 10_000; // 10 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(
        `[scoreRelevance] Sending request to OpenAI API (timeout: ${timeoutMs}ms)`,
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

      clearTimeout(timeoutId); // Clear timeout when the response is received

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `[scoreRelevance] OpenAI API error: ${response.status}. Response: ${errorBody}`,
        );
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const [score, explanation] = data.choices[0].message.content.trim().split(
        "|",
      );

      // Validate the score
      const parsedScore = parseInt(score, 10);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
        console.warn(`[scoreRelevance] Invalid score received: ${score}`);
        return {
          score: 0,
          explanation: "Invalid score received from the AI.",
        };
      }

      // Log performance metrics
      const endTime = performance.now();
      console.log(
        `[scoreRelevance] Completed in ${
          (endTime - startTime).toFixed(2)
        }ms. Score: ${parsedScore}`,
      );

      return {
        score: parsedScore,
        explanation: explanation?.trim() || "No explanation provided.",
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[scoreRelevance] Request timed out.");
      } else if (error instanceof Error) {
        console.error(`[scoreRelevance] Error: ${error.message}`);
      } else {
        console.error("[scoreRelevance] An unknown error occurred:", error);
      }
      throw error; // Re-throw the error after logging
    }
  });
}
