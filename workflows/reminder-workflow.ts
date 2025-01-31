import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { StoreArticleFunction } from "../functions/return_articles/store-articles.ts";
import { FilterDatastoreArticlesFunction } from "../functions/filter_articles/datastore-filter.ts";
import { FilterRelevantArticlesFunction } from "../functions/filter_articles/filter-relevance.ts";
import { SummarizeArticlesFunction } from "../functions/return_articles/summarize-articles.ts";
import { SendArticleMessagesFunction } from "../functions/return_articles/send-article-messages.ts";
import { GetLatestArticlesFunction } from "../functions/get_articles/get-recent-articles.ts";
import { ScoreRelevanceFunction } from "../functions/filter_articles/score-relevance.ts";

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
const getArticlesStep = ReminderWorkflow.addStep(
  GetLatestArticlesFunction,
  {},
);

// 2. Filter the articles to only include articles that were previously relevant
const filteredArticles = ReminderWorkflow.addStep(
  FilterDatastoreArticlesFunction,
  {
    articles: getArticlesStep.outputs.articles,
  },
);

// 3. Score the articles
const scoredArticles = ReminderWorkflow.addStep(
  ScoreRelevanceFunction,
  {
    articles: filteredArticles.outputs.articles,
  },
);

// 4. Store the articles in the datastore
ReminderWorkflow.addStep(StoreArticleFunction, {
  articles: scoredArticles.outputs.articles,
});

// 5. Filter the articles to only include articles that are relevant
const relevantArticles = ReminderWorkflow.addStep(
  FilterRelevantArticlesFunction,
  {
    articles: scoredArticles.outputs.articles,
  },
);
// 6. Summarize the articles
const summarizedArticles = ReminderWorkflow.addStep(
  SummarizeArticlesFunction,
  {
    articles: relevantArticles.outputs.articles,
  },
);
// 7. Send the articles to the channel
const sendArticles = ReminderWorkflow.addStep(SendArticleMessagesFunction, {
  articles: summarizedArticles.outputs.articles,
  channel_id: ReminderWorkflow.inputs.channel_id,
});
// 8. Send a message to the channel indicating that the articles have been sent
ReminderWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: ReminderWorkflow.inputs.channel_id,
  message: sendArticles.outputs.message,
});
