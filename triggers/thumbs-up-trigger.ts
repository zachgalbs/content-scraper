import { Trigger } from "deno-slack-api/types.ts";
import { TriggerEventTypes, TriggerTypes } from "deno-slack-api/mod.ts";
import { ReactionWorkflow } from "../workflows/thumbs-up-workflow.ts";

const ReactionTrigger: Trigger<typeof ReactionWorkflow.definition> = {
  type: TriggerTypes.Event,
  name: "Reaction added",
  description: "responds to a specific reactji",
  workflow: `#/workflows/${ReactionWorkflow.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.ReactionAdded,
    channel_ids: ["C088CHM1FAA"],
    filter: {
      version: 1,
      root: {
        statement: "{{data.reaction}} == eyes",
      },
    },
  },
  inputs: {
    channel: {
      value: "{{data.channel_id}}",
    },
    reaction: {
      value: "{{data.reaction}}",
    },
    message_ts: {
      value: "{{data.message_ts}}",
    },
  },
};

export default ReactionTrigger;
