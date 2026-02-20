import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/services/database/schema/index.ts',
  out: './src/shared/services/database/drizzle',
  dialect: 'sqlite',
  driver: 'expo',
});
