import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { AnalyzeReactionFunctionDefinition } from "../functions/reactions/analyze-reaction.ts";

export const ReactionWorkflow = DefineWorkflow({
  callback_id: "reaction_workflow",
  title: "Update message on reaction",
  description:
    "Update a message with more details when a thumbs up reaction is added",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      reaction: {
        type: Schema.types.string,
      },
      message_ts: {
        type: Schema.types.string,
      },
    },
    required: ["channel", "reaction", "message_ts"],
  },
});

ReactionWorkflow.addStep(
  AnalyzeReactionFunctionDefinition,
  {
    reaction: ReactionWorkflow.inputs.reaction,
    message_ts: ReactionWorkflow.inputs.message_ts,
    channel: ReactionWorkflow.inputs.channel,
  },
);
