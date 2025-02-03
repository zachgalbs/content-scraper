import pLimit from "npm:p-limit"; // Concurrency limiter

// Limit the number of simultaneous API calls
const limit = pLimit(5); // Maximum 5 simultaneous OpenAI API calls

export async function scoreRelevance(
  fullText: string,
): Promise<{ score: number; explanation: string }> {
  return await limit(async () => {
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
    const truncatedText = fullText.slice(0, 3000); // Limit to 3000 characters
    const requestBody = JSON.stringify({
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo for faster responses
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
      max_tokens: 150,
      temperature: 0.1,
    });

    // Use AbortController to implement a request timeout
    const controller = new AbortController();
    const timeoutMs = 10_000; // Increased to 10 seconds
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

      // Clear the timeout since we got a response
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error (${response.status}): ${
            errorData.error?.message || "Unknown error"
          }`,
        );
      }

      const data = await response.json();
      const output = data.choices[0]?.message?.content?.trim() || "";

      // Parse the score and explanation from the output (format: "score|explanation")
      const [scoreStr, ...explanationParts] = output.split("|");
      const score = parseInt(scoreStr, 10);
      const explanation = explanationParts.join("|").trim();

      // Validate the score
      if (isNaN(score) || score < 1 || score > 100) {
        throw new Error(
          `Invalid score from OpenAI API: ${scoreStr}. Full response: ${output}`,
        );
      }

      // Log performance metrics
      const endTime = performance.now();
      console.log(
        `[scoreRelevance] Completed in ${(endTime - startTime).toFixed(2)}ms`,
      );

      return { score, explanation };
    } catch (error: unknown) {
      // If this is a timeout error, provide a more specific message
      if (
        error && typeof error === "object" && "name" in error &&
        error.name === "AbortError"
      ) {
        console.error(
          `[scoreRelevance] Request timed out after ${timeoutMs}ms`,
        );
        // Return a default score for timeout cases to prevent workflow failure
        return {
          score: 50,
          explanation:
            "Scoring timed out - using default moderate relevance score",
        };
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  });
}
