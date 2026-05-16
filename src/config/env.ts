import { z } from 'zod';

const envSchema = z.object({
  VITE_APP_API_URL: z.string().url().default('http://localhost:8081'),
});

const rawEnv = (import.meta as ImportMeta & {
  env: Record<string, string | undefined>;
}).env;

export const env = envSchema.parse(rawEnv);
