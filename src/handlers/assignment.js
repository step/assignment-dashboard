import { assignments } from "../../config/assignments.js";
import { githubIds } from "../../config/github_ids.js";
import { testAssignment } from "../../js/main.js";

const calculateStats = (scores) => {
  const totalInterns = scores.length;
  const passingInterns = scores.filter((s) => s.summary.percentage >= 30);
  
  const passRate = (passingInterns.length / totalInterns) * 100;
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
  const scoresView = scores.map(({ name, summary, results }) => {
    // Calculate individual problem stats
    const problemBreakdown = results.map(result => {
      const totalTests = result.tests ? result.tests.length : 0;
      const passedTests = result.tests ? result.tests.filter(test => test.pass).length : 0;
      const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
      const lintIssues = result.lintIssues ? result.lintIssues.length : 0;
      
      return {
        name: result.name,
        percentage,
        lintIssues
      };
    });

    return {
      name,
      score: summary.percentage,
      issues: summary.lintErrors,
      problems: problemBreakdown,
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
  console.log("*".repeat(10), `${assignmentId} evaluation completed`);
  await store.addStats(assignmentId, {
    ...calculateStats(scores),
    date,
    name: assignmentId,
  });
  scores.forEach(s => {
    s.name = githubIds.find(g => g.id === s.name)?.name || s.name;
  });
  await store.addScores(assignmentId, scores);
};

export const getAssignments = (store) => store.getAssignmentStats(assignments);

export const serveAssignmentScore = async (c, store) => {
  const assignmentId = c.req.param("assignmentId");
  console.log(`Serving scores for assignment: ${assignmentId}`);
  const scores = await store.getScores(assignmentId);
  return c.json(scores);
};
