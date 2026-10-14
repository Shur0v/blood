import nextEnv from '@next/env';
import { defineConfig, env } from "prisma/config"; 

// The CLI, Next server, backup, and email worker must resolve the same database.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

export default defineConfig({ 
  schema: "prisma/schema.prisma", 
  datasource: { 
    url: env("DATABASE_URL") 
  } 
});
