import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";
import { Schema } from "deno-slack-sdk/mod.ts";

export const CheckArticlesFunction = DefineFunction({
  callback_id: "check_articles_function",
  title: "Check Articles",
  description: "Checks if the articles list is empty",
  source_file: "functions/return_articles/check-articles.ts",
  input_parameters: {
    properties: {
      articles: {
        type: Schema.types.array,
        items: {
          type: ArticleType,
        },
      },
    },
    required: ["articles"],
  },
  output_parameters: {
    properties: {
      isEmpty: { type: Schema.types.boolean },
      message: { type: Schema.types.string },
    },
    required: ["isEmpty"],
  },
});

export default SlackFunction(
  CheckArticlesFunction,
  ({ inputs }) => {
    const { articles } = inputs;
    const isEmpty = articles.length === 0;
    const message = "There are no new, relevant articles to send.";

    return {
      outputs: {
        isEmpty,
        message,
      },
    };
  },
);
