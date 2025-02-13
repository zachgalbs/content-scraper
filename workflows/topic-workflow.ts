import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

export const TopicWorkflow = DefineWorkflow({
  callback_id: "topic-workflow",
  title: "Create Topic",
  description: "Creates a new topic",
  input_parameters: {
    properties: {
      created_by: {
        type: Schema.slack.types.user_id,
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["created_by", "interactivity", "channel_id"],
  },
});

// First, add a form step to get user input
const formResponse = TopicWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Create a New Topic",
    description: "Configure your topic analysis settings",
    interactivity: TopicWorkflow.inputs.interactivity,
    fields: {
      elements: [
        {
          name: "article_count",
          title: "Number of Articles",
          type: Schema.types.number,
          description: "How many articles should be analyzed for this topic?",
          default: 5,
          minimum: 1,
          maximum: 20,
        },
      ],
      required: ["article_count"],
    },
  },
);

// Then send a confirmation message
TopicWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: TopicWorkflow.inputs.channel_id,
    message:
      `🎯 Will analyze ${formResponse.outputs.fields.article_count} articles for your topic!`,
  },
);
