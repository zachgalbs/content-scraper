import { Manifest } from "deno-slack-sdk/mod.ts";
import { ReminderWorkflow } from "./workflows/reminder-workflow.ts";
import { ArticleDatastore } from "./datastores/article-object-definition.ts";
/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "content-scraper",
  description: "A blank template for building Slack apps with Deno",
  icon: "assets/default_new_app_icon.png",
  functions: [],
  workflows: [ReminderWorkflow],
  outgoingDomains: [
    "feed.infoq.com",
    "techcrunch.com",
    "dev.to",
    "news.ycombinator.com",
    "mlops.substack.com",
  ],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
  datastores: [ArticleDatastore],
});
