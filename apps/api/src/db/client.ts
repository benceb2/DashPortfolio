import pg from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "@dashportfolio/db/types";
import { parseEnv } from "@dashportfolio/config/env";

const env = parseEnv(process.env);

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool }) });
