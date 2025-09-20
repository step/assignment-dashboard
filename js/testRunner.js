import * as chai from "chai";

const areEqual = (actual, expected, orderIndependent) => {
  switch (typeof expected) {
    case "string":
      if (expected === "NaN") {
        return actual.toString() === "NaN";
      }
      return chai.expect(actual).to.equal(expected);
    case "number":
      if (Number.isInteger(expected)) {
        return chai.expect(actual).to.deep.equal(expected);
      }
      if (isNaN(expected)) {
        return chai.expect(actual).to.be.NaN;
      }
      return chai.expect(actual).to.be.closeTo(expected, 0.01);
    default:
      return orderIndependent
        ? chai.expect(actual).to.have.deep.members(expected)
        : chai.expect(actual).to.deep.equal(expected);
  }
};

const hasPassed = (actual, expected, orderIndependent) => {
  try {
    areEqual(actual, expected, orderIndependent);
    return true;
  } catch {
    return false;
  }
};

const SOCMarker = "// START YOUR CODE AFTER THIS LINE. DO NOT REMOVE THIS LINE";

const funcifyFnWithSOC = (code, args, allowMultipleLogs) => {
  const [_, actualCode] = code.split(SOCMarker);
  return new Function(
    ...args,
    `
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(...args);
      ${actualCode}
      console.log = originalLog;
      return ${allowMultipleLogs ? "logs" : "logs[0]"};
    `,
  );
};

const funcifyFn = (code, fnName, args, allowMultipleLogs) => {
  if (code.includes(SOCMarker)) {
    return funcifyFnWithSOC(code, args, allowMultipleLogs);
  }
  return new Function("console", code + "\n" + "return " + fnName)({
    log: () => undefined,
    table: () => undefined,
    error: () => undefined,
  });
};

const runTestsForSingleFn = (fn, args, cases, orderIndependent) => {
  return cases.map((testCase) => {
    const actualArgs = args.map((arg) => testCase.inputs[arg]);
    const actual = fn(...actualArgs);
    return {
      ...testCase,
      actual,
      pass: hasPassed(actual, testCase.expected, orderIndependent),
    };
  });
};

self.addEventListener("message", async (event) => {
  const { name, code, fnName, cases, lintIssues, args, orderIndependent, allowMultipleLogs } =
    event.data;

  try {
    const fn = funcifyFn(code, fnName, args, allowMultipleLogs);
    const results = runTestsForSingleFn(fn, args, cases, orderIndependent);
    self.postMessage({ name, code, lintIssues, tests: results });
  } catch (error) {
    self.postMessage({
      name,
      code,
      lintIssues,
      error: error.message,
      tests: [],
    });
  }
});
