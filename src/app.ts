import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import ScoresStore from "./scores_store.js";

import {
  evaluateAssignment,
  getAssignmentEvaluation,
  getAssignments,
  serveAssignmentScore,
} from "./handlers/assignment.js";
import { handleWebhook, updateSelf } from "./handlers/webhook.js";
import {
  checkAuthStatus,
  handleLogin,
  handleLogout,
  requireAuth,
} from "./handlers/auth.ts";

export const createApp = async () => {
  const app = new Hono();
  const store = await ScoresStore.create();
  app.use("*", logger());

  // Authentication routes
  app.post("/api/login", handleLogin);
  app.post("/api/logout", handleLogout);
  app.get("/api/auth/status", checkAuthStatus);

  // Public API routes (no auth required)
  app.get("/api/assignments", async (c) => {
    return c.json(await getAssignments(store));
  });

  app.get("/api/assignments/:assignmentId/results", async (c) => {
    return c.json(await getAssignmentEvaluation(c, store));
  });

  app.post("/api/assignments/:assignmentId/evaluate", (c) => {
    evaluateAssignment(c.req.param("assignmentId"), store);
    return c.json({ status: "Evaluation started" });
  });

  app.post("/api/webhook", (c) => handleWebhook(c, store));

  // Serve login page
  app.get("/login", serveStatic({ path: "./public/html/login.html" }));

  // Public routes (no auth required)
  app.get(
    "/:assignment/scores.html",
    serveStatic({ path: "./public/html/scores.html" }),
  );
  app.get("/", serveStatic({ path: "./public/html/index.html" }));

  // Protected admin routes
  app.get(
    "/admin/:assignment",
    requireAuth,
    serveStatic({ path: "./public/html/adminPanel.html" }),
  );

  // Static files (public)
  app.get("*", serveStatic({ root: "./public" }));

  app.post("/clear", requireAuth, async (c) => {
    await store.clear();
    return c.json({ status: "cleared" });
  });

  app.get(
    "/api/admin/:assignmentId/score",
    requireAuth,
    (c) => serveAssignmentScore(c, store),
  );

  app.post("/api/update-self", updateSelf);

  return app;
};
