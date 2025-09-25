import eslintConfig from "../config/eslint.js";
import { githubIds } from "../config/github_ids.js";
import BatchWorker from "./batchWorker.js";

const worker = new BatchWorker("./worker.js");

const getTests = async (assignment) => {
  const data = await Deno.readTextFile(`./config/tests/${assignment}.json`);
  return JSON.parse(data);
};

export const testAssignment = async (assignmentName) => {
  const assignment = assignmentName;
  try {
    const tests = await getTests(assignment);
    const testJobs = githubIds.map(({ name, id }) => ({
      name,
      githubId: id,
      assignment,
      tests,
      eslintConfig,
    }));
    return new Promise((resolve) => {
      worker.queue(
        testJobs,
        resolve,
      );
    });
  } catch (e) {
    return Promise.reject(e);
  }
};
