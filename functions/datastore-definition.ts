import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

export const StoreArticleFunction = DefineFunction({
  callback_id: "store_article_function",
  title: "Store Article",
  description: "Stores an article in the ArticleDatastore",
  source_file: "functions/datastore-functions.ts",
  input_parameters: {
    properties: {
      title: { type: Schema.types.string },
      link: { type: Schema.types.string },
      pubDate: { type: Schema.types.string },
    },
    required: ["title", "link", "pubDate"],
  },
  output_parameters: {
    properties: {
      success: { type: Schema.types.boolean },
      message: { type: Schema.types.string },
    },
    required: ["success"],
  },
});

export default StoreArticleFunction;
