import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import ScoresStore from "./scores_store.js";
import { testAssignment } from "../js/main.js";

const calPercentage = (summary?: { total: number; passed: number }) => {
  if (!summary) return 0;
  return Math.floor((summary.passed / summary.total) * 100);
};

type InternAssignmentReport = {
  name: string;
  score: number;
  issues: number;
};

const calculateStats = (data: InternAssignmentReport[]) => {
  const totalInterns = data.length;
  const passRate =
    (data.filter((intern) => intern.score >= 70).length / totalInterns) * 100;
  const avgIssues = data.reduce((sum, intern) => sum + intern.issues, 0) /
    totalInterns;
  const avgScore = data.reduce((sum, intern) => sum + intern.score, 0) /
    totalInterns;

  return {
    totalInterns,
    passRate: Math.round(passRate),
    avgIssues: Math.round(avgIssues * 10) / 10, // Round to 1 decimal place
    avgScore: Math.round(avgScore),
  };
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
    return c.json({
      stats: calculateStats(scoresView),
      scores: scoresView,
    });
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
