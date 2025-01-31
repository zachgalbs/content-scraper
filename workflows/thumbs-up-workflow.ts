import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { AnalyzeReactionFunctionDefinition } from "../functions/reactions/analyze-reaction.ts";

export const ReactionWorkflow = DefineWorkflow({
  callback_id: "reaction_workflow",
  title: "Send a message on reaction",
  description: "Send a message when a reaction is added in a specific channel",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      reaction: {
        type: Schema.types.string,
      },
    },
    required: ["channel", "reaction"],
  },
});

const reactionMessageStep = ReactionWorkflow.addStep(
  AnalyzeReactionFunctionDefinition,
  {
    reaction: ReactionWorkflow.inputs.reaction,
  },
);

ReactionWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: ReactionWorkflow.inputs.channel,
  message: reactionMessageStep.outputs.message,
});
