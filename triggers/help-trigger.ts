import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { HelpWorkflow } from "../workflows/help-workflow.ts";

const helpTrigger: Trigger<typeof HelpWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Get Content Scraper Help",
  description: "Get help about the Content Scraper app",
  workflow: `#/workflows/${HelpWorkflow.definition.callback_id}`,
  inputs: {
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    help_topic: {
      value: "{{data.topic}}",
    },
  },
};

export default helpTrigger;
