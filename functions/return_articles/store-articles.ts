import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
import { ArticleDatastore } from "../../datastores/datastore-definition.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { ArticleType } from "../other/article-type-definition.ts";

export const StoreArticleFunction = DefineFunction({
  callback_id: "store_article_function",
  title: "Store Articles",
  description: "Stores a list of articles in the ArticleDatastore",
  source_file: "functions/return_articles/store-articles.ts",
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
      success: { type: Schema.types.boolean },
      message: { type: Schema.types.string },
    },
    required: ["success"],
  },
});

export default SlackFunction(
  StoreArticleFunction,
  async ({ inputs, client }) => {
    const { articles } = inputs;

    try {
      // check if the articles array is empty
      if (!articles || articles.length === 0 || !articles[0]?.title) {
        return {
          outputs: {
            success: false,
            message: "No articles to store.",
          },
        };
      }

      for (const article of articles) {
        try {
          // Generate a unique ID for the article based on its title and link
          const articleId = `${article.title}-${article.link}`;

          // Check if the article already exists in the datastore
          const getResp = await client.apps.datastore.get<
            typeof ArticleDatastore.definition
          >({
            datastore: ArticleDatastore.name,
            id: articleId,
          });

          if (getResp.ok && getResp.item) {
            console.log(`Article already exists: ${article.title}`);

            // Validate the relevance score before updating
            const relevanceScore = typeof article.score === "number"
              ? article.score
              : null;

            // Create update payload with proper null checks
            const updatePayload = {
              id: articleId,
              channel_id: article.channel_id || "",
              title: article.title.trim(),
              link: article.link.trim(),
              pubDate: article.pubDate || new Date().toISOString(),
              times_posted: (getResp.item?.times_posted || 0) + 1,
              relevance_score: relevanceScore,
              score: article.score || 0,
              explanation: article.explanation || "",
            };

            const updateResp = await client.apps.datastore.update<
              typeof ArticleDatastore.definition
            >({
              datastore: ArticleDatastore.name,
              item: updatePayload,
            });

            if (!updateResp.ok) {
              console.error(
                `Error updating article: ${article.title}. Error: ${updateResp.error}`,
                `\nFull response: ${JSON.stringify(updateResp)}`,
              );
              // Log the item we're trying to update for debugging
              console.log(`Update payload: ${JSON.stringify(updatePayload)}`);
              // Continue instead of throwing to allow other articles to be processed
              continue;
            }

            continue; // Skip storing this article as new
          }

          // Attempt to store each new article in the datastore
          const createPayload = {
            id: articleId,
            channel_id: article.channel_id || "",
            title: article.title.trim(),
            summary: article.summary || "",
            link: article.link.trim(),
            pubDate: article.pubDate || new Date().toISOString(),
            times_posted: 1,
            relevance_score: article.score || 0,
            score: article.score || 0,
            explanation: article.explanation || "",
          };

          const putResp = await client.apps.datastore.put<
            typeof ArticleDatastore.definition
          >({
            datastore: ArticleDatastore.name,
            item: createPayload,
          });

          if (!putResp.ok) {
            console.error(
              `Error storing new article: ${article.title}. Error: ${putResp.error}`,
            );
            throw new Error(putResp.error);
          }

          console.log(`Successfully stored article: ${article.title}`);
        } catch (articleError) {
          console.error(
            `Error processing article: ${article.title}`,
            articleError,
          );
          // Continue with next article instead of failing the entire batch
          continue;
        }
      }

      return {
        outputs: {
          success: true,
          message: "Successfully processed all articles.",
        },
      };
    } catch (error) {
      console.error("Error in StoreArticleFunction:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return {
        outputs: {
          success: false,
          message: `Error storing articles: ${errorMessage}`,
        },
      };
    }
  },
);
