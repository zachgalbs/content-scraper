import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

export const ArticleType = DefineType({
  name: "article", // Must match exactly in your functions
  type: Schema.types.object,
  properties: {
    title: { type: Schema.types.string },
    source: { type: Schema.types.string },
    link: { type: Schema.types.string },
    pubDate: { type: Schema.types.string },
    creator: { type: Schema.types.string },
    summary: { type: Schema.types.string },
    score: { type: Schema.types.number },
    explanation: { type: Schema.types.string },
  },
  required: [
    "title",
    "source",
    "link",
    "pubDate",
    "creator",
    "summary",
    "score",
    "explanation",
  ],
});
