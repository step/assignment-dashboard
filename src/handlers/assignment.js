import { testAssignment } from "../../js/main.js";

const calPercentage = (summary) => {
  if (!summary) return 0;
  return Math.floor((summary.passed / summary.total) * 100);
};

const calculateStats = (data) => {
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

export const getAssignmentEvaluation = async (c, store) => {
  const assignmentId = c.req.param("assignmentId");
  const scores = await store.getScores(assignmentId);
  const scoresView = scores.map(({ name, summary }) => {
    return {
      name,
      score: calPercentage(summary),
      issues: summary ? summary.lintErrors : 0,
    };
  });
  return {
    stats: calculateStats(scoresView),
    scores: scoresView,
  };
};

export const evaluateAssignment = async (c, store) => {
  const assignmentId = c.req.param("assignmentId");
  console.log(c.req.param("assignmentId"));
  console.log(`${assignmentId} evaluation started`);
  const scores = await testAssignment(assignmentId);
  console.log(`${assignmentId} evaluation completed`);
  store.addScores(assignmentId, scores);
};
