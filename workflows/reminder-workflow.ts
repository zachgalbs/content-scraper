import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { StoreArticleFunction } from "../functions/return_articles/store-articles.ts";
import { getLatestArticles } from "../functions/get_articles/get-recent-articles.ts";
import { FilterDatastoreArticlesFunction } from "../functions/filter_articles/datastore-filter.ts";
import { FilterRelevantArticlesFunction } from "../functions/filter_articles/filter-relevance.ts";
import { SummarizeArticlesFunction } from "../functions/return_articles/summarize-articles.ts";
import { SendArticleMessagesFunction } from "../functions/return_articles/send-article-messages.ts";
import { CheckArticlesFunction } from "../functions/return_articles/check-articles.ts";

export const ReminderWorkflow = DefineWorkflow({
  callback_id: "reminder-workflow",
  title: "Reminder Workflow",
  description: "A workflow to send reminders to users",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
    },
    required: ["channel_id"],
  },
});

// 1. Get the latest articles
const articles = await getLatestArticles();

// 2. Filter the articles to only include articles that are not already in the datastore
const filteredArticles = ReminderWorkflow.addStep(
  FilterDatastoreArticlesFunction,
  {
    articles: articles,
  },
);

// 3. Filter the articles to only include articles that are relevant
const relevantArticles = ReminderWorkflow.addStep(
  FilterRelevantArticlesFunction,
  {
    articles: filteredArticles.outputs.articles,
  },
);

// const checkArticles = ReminderWorkflow.addStep(CheckArticlesFunction, {
//   articles: relevantArticles.outputs.articles,
// });

// 4. Store the articles in the datastore
ReminderWorkflow.addStep(StoreArticleFunction, {
  articles: relevantArticles.outputs.articles,
});

// 5. Summarize the articles
const summarizedArticles = ReminderWorkflow.addStep(
  SummarizeArticlesFunction,
  {
    articles: relevantArticles.outputs.articles,
  },
);

// 6. Send the articles to the channel
ReminderWorkflow.addStep(SendArticleMessagesFunction, {
  articles: summarizedArticles.outputs.articles,
  channel_id: ReminderWorkflow.inputs.channel_id,
});

// ReminderWorkflow.addStep(Schema.slack.functions.SendMessage, {
//   channel_id: ReminderWorkflow.inputs.channel_id,
//   message: checkArticles.outputs.message,
// });
