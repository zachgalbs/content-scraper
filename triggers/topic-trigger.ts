import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { TopicWorkflow } from "../workflows/topic-workflow.ts";

const topicTrigger: Trigger<typeof TopicWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Create Topic",
  description: "Create a new topic for article categorization",
  workflow: `#/workflows/${TopicWorkflow.definition.callback_id}`,
  inputs: {
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    topic_name: {
      value: "{{data.text}}",
    },
    description: {
      value: "{{data.description}}",
    },
  },
};

export default topicTrigger;
