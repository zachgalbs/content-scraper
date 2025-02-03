import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const AnalyzeReactionFunctionDefinition = DefineFunction({
  callback_id: "analyze-reaction",
  title: "Analyze a reaction",
  description: "Analyzes a reaction and returns a message",
  source_file: "functions/reactions/analyze-reaction.ts",
  input_parameters: {
    properties: {
      reaction: {
        type: Schema.types.string,
        description: "Reaction added by the user",
      },
    },
    required: ["reaction"],
  },
  output_parameters: {
    properties: {
      message: {
        type: Schema.types.string,
        description: "Message based on the reaction",
      },
    },
    required: ["message"],
  },
});

export default SlackFunction(
  AnalyzeReactionFunctionDefinition,
  ({ inputs }) => {
    const { reaction } = inputs;
    const message = "Thanks! 😊";
    return { outputs: { message } };
  },
);
