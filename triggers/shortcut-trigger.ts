import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ReminderWorkflow } from "../workflows/reminder-workflow.ts";

const reminderShortcutTrigger: Trigger<typeof ReminderWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Content Scraper Shortcut",
  description: "Manually trigger the reminder workflow via a Slack shortcut",
  workflow: `#/workflows/${ReminderWorkflow.definition.callback_id}`,
  inputs: {
    channel_id: {
      value: "C088CHM1FAA",
    },
  },
};

export default reminderShortcutTrigger;
