import JSZip from "jszip";
import eslint from "eslint";
import BatchWorker from "./batchWorker.js";

const fetchBlob = (url) => Deno.readFile(`.${url}`);

const unzipBlob = async (blob) => await new JSZip().loadAsync(blob);

const readFile = async (zip, filename) => {
  const r = new RegExp(filename + "$");
  const file = zip.file(r)[0];
  if (file) {
    return await file.async("text");
  }
  throw new Error(`'${filename}' not found in zip`);
};

const addSummary = (results, total) => {
  let passed = 0;
  let lintErrors = 0;
  results.forEach(({ error, tests, lintIssues }) => {
    passed += error ? 0 : tests.filter(({ pass }) => pass).length;
    lintErrors += lintIssues ? lintIssues.length : 0;
  });
  const percentage = total === 0 ? 0 : Math.floor((passed / total) * 100);
  return { total, passed, failed: total - passed, lintErrors, percentage };
};

let batchWorker = null;

const startBatchWorker = () => {
  const workerUrl = new URL("./testRunner.js", import.meta.url);
  batchWorker = new BatchWorker(workerUrl, 2000);
};

startBatchWorker();

const SOCMarker = "// START YOUR CODE AFTER THIS LINE. DO NOT REMOVE THIS LINE\n";

const lintCode = async (linter, code) => {
  const [setup, solution] = code.split(SOCMarker);
  const codeToLint = `/* eslint-disable */
${setup}
${SOCMarker}/* eslint-enable */
${solution}`;

  const result = await linter.lintText(codeToLint);
  return result.map((r) => r.messages)
    .flat()
    .map((issue) => ({
      ruleId: issue.ruleId,
      message: issue.message,
      line: issue.line - 3,
      column: issue.column,
    }));
};

const createJobs = async (blobURL, tests, lintConfig) => {
  const blob = await fetchBlob(blobURL);
  const zip = await unzipBlob(blob);
  const linter = new eslint.ESLint({
    overrideConfigFile: "./config/eslint.js",
  });
  return await Promise.all(
    tests.map(
      async (
        {
          name,
          file,
          fnName,
          cases,
          args,
          orderIndependent,
          allowMultipleLogs,
        },
      ) => {
        const code = await readFile(zip, file);
        const lintIssues = await lintCode(linter, code, lintConfig);
        return {
          name,
          cases,
          code,
          fnName,
          lintIssues,
          args,
          orderIndependent,
          allowMultipleLogs,
        };
      },
    ),
  );
};

self.addEventListener("message", async (event) => {
  const { githubId, assignment, tests, lintConfig } = event.data;
  const blobURL = "/source/" + assignment + "/" + githubId + ".zip";

  try {
    const jobs = await createJobs(blobURL, tests, lintConfig);
    const total = tests.map((x) => x.cases.length).reduce((a, b) => a + b, 0);

    batchWorker.queue(jobs, (results) => {
      const summary = addSummary(results, total);
      self.postMessage({ name: githubId, summary, results });
    });
  } catch (e) {
    self.postMessage({
      name: githubId,
      error: e.message,
      summary: { total: 0, passed: 0, failed: 0, lintErrors: 0, percentage: 0 },
      results: [],
    });
  }
});
