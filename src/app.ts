import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import ScoresStore from "./scores_store.js";

import {
  evaluateAssignment,
  getAssignmentEvaluation,
  getAssignments,
} from "./handlers/assignment.js";

export const createApp = async () => {
  const app = new Hono();
  const store = await ScoresStore.create();
  app.use("*", logger());

  app.get("/api/assignments", async (c) => {
    return c.json(await getAssignments(store));
  });

  // API endpoint to serve assignment results
  app.get("/api/assignments/:assignmentId/results", async (c) => {
    return c.json(await getAssignmentEvaluation(c, store));
  });

  app.post("/api/assignments/:assignmentId/evaluate", (c) => {
    evaluateAssignment(c, store);
    return c.json({ status: "Evaluation started" });
  });

  app.get(
    "/:assignment/scores.html",
    serveStatic({ path: "./public/html/scores.html" }),
  );
  app.get("*", serveStatic({ root: "./public" }));

  return app;
};
