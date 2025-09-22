import { assignments } from "../../config/assignments.js";
import { testAssignment } from "../../js/main.js";

const calculateStats = (scores) => {
  const totalInterns = scores.length;
  const passRate =
    (scores.filter((intern) => intern.score >= 70).length / totalInterns) * 100;
  const avgIssues =
    scores.reduce((sum, intern) => sum + intern.summary.lintErrors, 0) /
    totalInterns;
  const avgScore =
    scores.reduce((sum, intern) => sum + intern.summary.percentage, 0) /
    totalInterns;

  return {
    totalInterns,
    passRate: Math.round(passRate),
    avgIssues: Math.round(avgIssues * 10) / 10, // Round to 1 decimal place
    avgScore: Math.round(avgScore),
  };
};

export const getAssignmentEvaluation = async (c, store) => {
  const assignmentId = c.req.param("assignmentId");
  const scores = await store.getScores(assignmentId);
  const scoresView = scores.map(({ name, summary }) => {
    return {
      name,
      score: summary.percentage,
      issues: summary.lintErrors,
    };
  });
  const stats = await store.getStats(assignmentId);
  return {
    stats,
    scores: scoresView,
  };
};

export const evaluateAssignment = async (assignmentId, store) => {
  console.log("*".repeat(10), `${assignmentId} evaluation started`);
  const date = new Date();
  const scores = await testAssignment(assignmentId);
  console.log(scores);
  console.log("*".repeat(10), `${assignmentId} evaluation completed`);

  await store.addStats(assignmentId, {
    ...calculateStats(scores),
    date,
    name: assignmentId,
  });
  await store.addScores(assignmentId, scores);
};

export const getAssignments = (store) => store.getAssignmentStats(assignments);

export const serveAssignmentScore = async (c, store) => {
  const assignmentId = c.req.param("assignmentId");
  const scores = await store.getScores(assignmentId);
  return c.json(scores);
};
