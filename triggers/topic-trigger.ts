import { Trigger } from "deno-slack-api/types.ts";
import { TopicWorkflow } from "../workflows/topic-workflow.ts";

const trigger: Trigger<typeof TopicWorkflow.definition> = {
  type: "shortcut",
  name: "Create New Topic",
  description: "Create a new topic for article analysis",
  workflow: "#/workflows/topic-workflow",
  inputs: {
    created_by: {
      value: "{{data.user_id}}",
    },
    interactivity: {
      value: "{{data.interactivity}}",
    },
    channel_id: {
      value: "{{data.channel_id}}",
    },
  },
};

export default trigger;
