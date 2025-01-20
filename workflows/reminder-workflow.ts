import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { getArticleInfo } from "../functions/article-functions.ts";
import { scoreRelevance } from "../functions/article-functions.ts";
// Define the workflow
export const ReminderWorkflow = DefineWorkflow({
  callback_id: "reminder-workflow",
  title: "Reminder Workflow",
  description: "A workflow to send reminders to users",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      message: { type: Schema.types.string },
    },
    required: ["channel_id", "message"],
  },
});

const articles = await getArticleInfo();

// Add a step to the workflow for each article
for (const article of articles) {
  const { score, explanation } = await scoreRelevance(
    `${article.title} ${article.summary}`,
  ); // Get relevance score and explanation from AI
  ReminderWorkflow.addStep(Schema.slack.functions.SendMessage, {
    channel_id: ReminderWorkflow.inputs.channel_id,
    message:
      `*Source:* ${article.source}\n*Title:* ${article.title}\n*Author:* ${article.creator}\n*URL:* <${article.link}>\n*Summary:* ${article.summary}\n*Relevance Score:* ${score}\n*Explanation:* ${explanation}`,
  });
}
