import "reflect-metadata";
import { join } from "path";
import getPort from "get-port";
import { configure } from "japa";
import sourceMapSupport from "source-map-support";
import execa from "execa";

process.env.NODE_ENV = "testing";
process.env.MYSQL_DB_NAME = "testing";
process.env.LOG_LEVEL = "fatal";
process.env.ADONIS_ACE_CWD = join(__dirname);
sourceMapSupport.install({ handleUncaughtExceptions: false });

async function runMigrations() {
  await execa.node("ace", ["migration:run"]);
}

async function rollbackMigrations() {
  await execa.node("ace", ["migration:rollback"]);
}

async function startHttpServer() {
  const { Ignitor } = await import("@adonisjs/core/build/src/Ignitor");
  process.env.PORT = String(await getPort());
  await new Ignitor(__dirname).httpServer().start();
}

configure({
  files: ["test/**/*.spec.ts"],
  before: [runMigrations, startHttpServer],
  after: [rollbackMigrations]
});
