import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";

const app = new Hono();

app.use("*", logger());

app.get("/", serveStatic({ path: "./public/html/index.html" }));
app.get("*", serveStatic({ root: "./public" }));

export { app };
