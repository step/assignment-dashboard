import { eslintConfig } from "../config/eslint.js";
import { githubIds } from "../config/github_ids.js";
import BatchWorker from "./batchWorker.js";

const sortResults = (results) =>
  results.sort((a, b) => {
    if (a.error) return -1;
    if (a.summary && b.summary) {
      return b.summary.failed - a.summary.failed;
    }
    return 0;
  });

const worker = new BatchWorker("./worker.js");

const renderResults = (template, results) => {
  const sortedResults = sortResults(results);

  render(template, sortedResults);
};

const getTests = async (assignment) => {
  const data = await Deno.readTextFile(`./config/tests/${assignment}.json`);
  return JSON.parse(data);
};

export const testAssignment = async (assignmentName) => {
  const assignment = assignmentName;
  try {
    const tests = await getTests(assignment);
    const testJobs = githubIds.map((githubId) => ({
      githubId,
      assignment,
      tests,
      eslintConfig,
    }));

    worker.queue(
      testJobs,
      (results) => console.log("All done", "*".repeat(100), "\n", results),
    );
  } catch (e) {
    renderResults(template, { error: e.message });
  }
};
