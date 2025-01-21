import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ReminderWorkflow } from "../workflows/reminder-workflow.ts";

const reminderScheduledTrigger: Trigger<typeof ReminderWorkflow.definition> = {
  type: TriggerTypes.Scheduled,
  name: "Hourly Reminder",
  description: "Triggers the reminder workflow every hour",
  workflow: `#/workflows/${ReminderWorkflow.definition.callback_id}`,
  schedule: {
    start_time: new Date().toISOString(),
    frequency: {
      type: "hourly",
      repeats_every: 1,
    },
  },
  inputs: {
    channel_id: {
      value: "C088CHM1FAA",
    },
  },
};

export default reminderScheduledTrigger;
