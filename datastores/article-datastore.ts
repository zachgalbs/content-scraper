import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const ArticleDatastore = DefineDatastore({
  name: "article_datastore",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
  },
});

export default ArticleDatastore;
