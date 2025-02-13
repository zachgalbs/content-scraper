import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const ArticleDatastore = DefineDatastore({
  name: "article_datastore",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    title: { type: Schema.types.string },
    link: { type: Schema.types.string },
    pubDate: { type: Schema.types.string },
    times_posted: { type: Schema.types.number },
    relevance_score: { type: Schema.types.number },
    explanation: { type: Schema.types.string },
    fullText: { type: Schema.types.string },
  },
});

export default ArticleDatastore;
