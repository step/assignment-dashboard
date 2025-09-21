import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import ScoresStore from "./scores_store.js";
import { testAssignment } from "../js/main.js";

const calPercentage = (summary?: { total: number; passed: number }) => {
  if (!summary) return 0;
  return Math.floor((summary.passed / summary.total) * 100);
};

export const createApp = async () => {
  const app = new Hono();
  const store = await ScoresStore.create();
  app.use("*", logger());

  // API endpoint to serve assignment results
  app.get("/api/assignments/:assignmentId/results", async (c) => {
    const assignmentId = c.req.param("assignmentId");
    const scores = await store.getScores(assignmentId);
    const scoresView = scores.map(({ name, summary }) => {
      return {
        name,
        score: calPercentage(summary),
        issues: summary ? summary.lintErrors : 0,
      };
    });
    return c.json(scoresView);
  });

  app.post("/api/assignments/evaluate", (c) => {
    testAssignment("js-assignment-1").then((scores) => {
      console.log("js-assignment-1 evaluation completed");
      store.addScores("js-assignment-1", scores);
    });
    return c.json({ status: "Evaluation started" });
  });

  app.get(
    "/:assignment/scores.html",
    serveStatic({ path: "./public/html/scores.html" }),
  );
  app.get("*", serveStatic({ root: "./public" }));

  return app;
};
