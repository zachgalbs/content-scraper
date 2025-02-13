import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

export const TopicWorkflow = DefineWorkflow({
  callback_id: "topic-workflow",
  title: "Create Topic",
  description: "Creates a new topic for article categorization",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      topic_name: {
        type: Schema.types.string,
        description: "Name of the topic to create",
      },
      description: {
        type: Schema.types.string,
        description: "Optional description of the topic",
        default: "",
      },
    },
    required: ["channel_id", "topic_name"],
  },
});

// Add step to create topic and send confirmation
TopicWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: TopicWorkflow.inputs.channel_id,
    message: TopicWorkflow.inputs.description
      ? `🎯 Created new topic: *${TopicWorkflow.inputs.topic_name}*\n` +
        `📝 Description: ${TopicWorkflow.inputs.description}\n\n` +
        `Articles matching this topic will be tagged accordingly.`
      : `🎯 Created new topic: *${TopicWorkflow.inputs.topic_name}*\n\n` +
        `Articles matching this topic will be tagged accordingly.`,
  },
);
