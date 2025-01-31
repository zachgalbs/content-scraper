import { Manifest } from "deno-slack-sdk/mod.ts";
import { ReminderWorkflow } from "./workflows/reminder-workflow.ts";
import { ReactionWorkflow } from "./workflows/thumbs-up-workflow.ts";
import { ArticleDatastore } from "./datastores/datastore-definition.ts";
import { StoreArticleFunction } from "./functions/return_articles/store-articles.ts";
import { SendArticleMessagesFunction } from "./functions/return_articles/send-article-messages.ts";
import { FilterDatastoreArticlesFunction } from "./functions/filter_articles/datastore-filter.ts";
import { ScoreRelevanceFunction } from "./functions/filter_articles/score-relevance.ts";
import { ArticleType } from "./functions/other/article-type-definition.ts";
/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "content-scraper",
  description: "A Slack app for scraping and processing content",
  icon: "assets/default_new_app_icon.png",
  functions: [
    StoreArticleFunction,
    SendArticleMessagesFunction,
    FilterDatastoreArticlesFunction,
    ScoreRelevanceFunction,
  ],
  workflows: [ReminderWorkflow, ReactionWorkflow],
  outgoingDomains: [
    "api.openai.com",
    "feed.infoq.com",
    "infoq.com",
    "techcrunch.com",
    "dev.to",
    "news.ycombinator.com",
    "ycombinator.com",
    "mlops.substack.com",
    "future.forem.com",
    "technologyreview.com",
    "kdnuggets.com",
    "analyticsinsight.net",
    "artificialintelligence-news.com",
    "aimagazine.com",
    "cio.com",
    "nutanix.com",
    "techfundingnews.com",
    "prweb.com",
    "investor.synaptics.com",
    "rss.arxiv.org",
  ],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "reactions:read",
  ],
  datastores: [ArticleDatastore],
  types: [ArticleType],
});
