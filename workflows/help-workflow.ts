import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

export const HelpWorkflow = DefineWorkflow({
  callback_id: "help-workflow",
  title: "Help Workflow",
  description: "Provides help and information about the app",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      help_topic: {
        type: Schema.types.string,
        description: "Optional topic to get help about",
        default: "general",
      },
    },
    required: ["channel_id"],
  },
});

// Add step to send help message
HelpWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: HelpWorkflow.inputs.channel_id,
    message: HelpWorkflow.inputs.help_topic === "general"
      ? "👋 *Welcome to Content Scraper Help!*\n\n" +
        "*Available Commands:*\n" +
        "• `/content-help` - Show this general help message\n" +
        "• `/content-help sources` - List available news sources\n" +
        "• `/content-help reactions` - Learn about reaction controls\n" +
        "• `/content-help scoring` - Understand how articles are scored\n\n" +
        "*Quick Tips:*\n" +
        "• Articles are automatically fetched every hour\n" +
        "• Only articles with relevance score > 50 are shared\n" +
        "• Use 👍 to save an article to the archive channel\n" +
        "• Use 👎 to remove an irrelevant article"
      : HelpWorkflow.inputs.help_topic === "sources"
      ? "*Available News Sources:*\n" +
        "• InfoQ\n" +
        "• TechCrunch\n" +
        "• Dev.to\n" +
        "• MIT Technology Review\n" +
        "• KDnuggets\n" +
        "• AI Magazine\n" +
        "• CIO.com\n" +
        "• arXiv.org"
      : HelpWorkflow.inputs.help_topic === "reactions"
      ? "*Reaction Controls:*\n" +
        "• 👍 (+1) - Save article to archive channel\n" +
        "• 👎 (-1) - Remove article from current channel\n" +
        "\nNote: These reactions only work on messages from the bot"
      : HelpWorkflow.inputs.help_topic === "scoring"
      ? "*Article Scoring System:*\n" +
        "• Each article is scored 0-100 based on AI/ML relevance\n" +
        "• Only articles scoring > 50 are shared\n" +
        "• Scoring considers:\n" +
        "  - Title relevance\n" +
        "  - Content analysis\n" +
        "  - Technical depth\n" +
        "  - Topic alignment with AI/ML"
      : "Topic not found. Try 'general', 'sources', 'reactions', or 'scoring'",
  },
);
