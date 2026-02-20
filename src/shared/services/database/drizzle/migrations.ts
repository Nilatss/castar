// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo
// SQL is inlined to avoid dependency on babel-plugin-inline-import

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`accounts\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`remote_id\` text,
\t\`user_id\` text NOT NULL,
\t\`name\` text NOT NULL,
\t\`type\` text NOT NULL,
\t\`currency\` text DEFAULT 'UZS' NOT NULL,
\t\`balance\` real DEFAULT 0 NOT NULL,
\t\`icon\` text,
\t\`color\` text,
\t\`is_archived\` integer DEFAULT false NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\t\`synced_at\` integer
);
--> statement-breakpoint
CREATE TABLE \`budgets\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`remote_id\` text,
\t\`user_id\` text NOT NULL,
\t\`family_group_id\` text,
\t\`category_id\` text,
\t\`name\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`currency\` text DEFAULT 'UZS' NOT NULL,
\t\`period\` text NOT NULL,
\t\`start_date\` integer NOT NULL,
\t\`end_date\` integer,
\t\`is_active\` integer DEFAULT true NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\t\`synced_at\` integer,
\tFOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`idx_budgets_user\` ON \`budgets\` (\`user_id\`,\`is_active\`);--> statement-breakpoint
CREATE TABLE \`categories\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`remote_id\` text,
\t\`user_id\` text NOT NULL,
\t\`name\` text NOT NULL,
\t\`icon\` text DEFAULT '📁' NOT NULL,
\t\`color\` text DEFAULT '#808080' NOT NULL,
\t\`type\` text NOT NULL,
\t\`is_default\` integer DEFAULT false NOT NULL,
\t\`parent_id\` text,
\t\`sort_order\` integer DEFAULT 0 NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\t\`synced_at\` integer
);
--> statement-breakpoint
CREATE INDEX \`idx_categories_user\` ON \`categories\` (\`user_id\`);--> statement-breakpoint
CREATE TABLE \`exchange_rates\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`base_currency\` text NOT NULL,
\t\`target_currency\` text NOT NULL,
\t\`rate\` real NOT NULL,
\t\`fetched_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`recurrings\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`user_id\` text NOT NULL,
\t\`account_id\` text NOT NULL,
\t\`category_id\` text NOT NULL,
\t\`type\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`currency\` text DEFAULT 'UZS' NOT NULL,
\t\`description\` text,
\t\`frequency\` text NOT NULL,
\t\`next_date\` integer NOT NULL,
\t\`is_active\` integer DEFAULT true NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\tFOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE no action,
\tFOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`sync_queue\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`table_name\` text NOT NULL,
\t\`record_id\` text NOT NULL,
\t\`action\` text NOT NULL,
\t\`data\` text NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`attempts\` integer DEFAULT 0 NOT NULL,
\t\`last_error\` text
);
--> statement-breakpoint
CREATE INDEX \`idx_sync_queue_pending\` ON \`sync_queue\` (\`attempts\`);--> statement-breakpoint
CREATE TABLE \`transactions\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`remote_id\` text,
\t\`user_id\` text NOT NULL,
\t\`account_id\` text NOT NULL,
\t\`category_id\` text NOT NULL,
\t\`family_group_id\` text,
\t\`type\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`currency\` text DEFAULT 'UZS' NOT NULL,
\t\`amount_in_default\` real,
\t\`exchange_rate\` real,
\t\`description\` text,
\t\`date\` integer NOT NULL,
\t\`is_recurring\` integer DEFAULT false NOT NULL,
\t\`recurring_id\` text,
\t\`voice_input\` integer DEFAULT false NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\t\`synced_at\` integer,
\tFOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE no action,
\tFOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`idx_transactions_user_date\` ON \`transactions\` (\`user_id\`,\`date\`);--> statement-breakpoint
CREATE INDEX \`idx_transactions_category\` ON \`transactions\` (\`category_id\`);`;

export default {
  journal,
  migrations: {
    m0000,
  },
};
