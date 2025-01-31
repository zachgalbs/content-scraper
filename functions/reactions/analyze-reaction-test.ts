import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import ReactionMessageFunction from "./analyze-reaction.ts";

const { createContext } = SlackFunctionTester("reaction_message_function");

Deno.test("Reaction message function test", async () => {
  const inputs = { reaction: "sunglasses" };
  const { outputs } = await ReactionMessageFunction(createContext({ inputs }));
  assertEquals(outputs?.message, "Cool! 😎");

  const inputsThumbsUp = { reaction: "thumbsup" };
  const { outputs: outputsThumbsUp } = await ReactionMessageFunction(
    createContext({ inputs: inputsThumbsUp }),
  );
  assertEquals(outputsThumbsUp?.message, "Great! 👍");
});
