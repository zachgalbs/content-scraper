import { StoreArticleFunction } from "./datastore-functions.ts";
import { ArticleDatastore } from "../datastores/article-datastore.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";

export default SlackFunction(
  StoreArticleFunction,
  async ({ inputs, client }) => {
    const articleId = `${inputs.title}-${inputs.link}`; // Generate a unique ID for the article

    // Attempt to store the article in the datastore
    const putResp = await client.apps.datastore.put<
      typeof ArticleDatastore.definition
    >({
      datastore: ArticleDatastore.name,
      item: {
        id: articleId,
        title: inputs.title,
        link: inputs.link,
        pubDate: inputs.pubDate,
      },
    });

    if (!putResp.ok) {
      const errorMsg =
        `Error storing article. Contact the app maintainers with the following information - (Error detail: ${putResp.error})`;
      console.log(errorMsg);

      return { error: errorMsg };
    }

    return {
      outputs: {
        success: true,
        message: "Article stored successfully.",
      },
    };
  },
);
