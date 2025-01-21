import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const ArticleDatastore = DefineDatastore({
  name: "article_datastore",
  primary_key: "title",
  attributes: {
    title: { type: Schema.types.string },
    link: { type: Schema.types.string },
    pubDate: { type: Schema.types.string },
  },
});

export default ArticleDatastore;
