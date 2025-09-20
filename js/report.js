const showReportDetail = (article, fileName) => {
  const reportDetailSection = article.querySelector(".report-detail");
  for (const node of reportDetailSection.children) {
    node.classList.add("hidden");
  }
  reportDetailSection
    .querySelector(`[data-file="${fileName}"]`)
    .classList.remove("hidden");
};

const findActiveTab = (parent) => parent.querySelector("[data-tab-active]");
const findActiveFilename = (parent) =>
  parent.querySelector("[data-file-active]");

const tabSelected = (e) => {
  const article = e.currentTarget.parentNode.parentNode;
  const activeTab = findActiveTab(article);
  const activeFile = findActiveFilename(article);
  const fileName = activeFile.attributes["data-file-name"].value;

  activeTab.removeAttribute("data-tab-active");
  e.target.setAttribute("data-tab-active", "true");
  activateTabContent(article, fileName);
};

const activateTabContent = (article, fileName) => {
  const activeTab = findActiveTab(article);
  const activeTabId = activeTab.attributes["data-tab-id"].value;
  const reportDetailOfFile = article.querySelector(`[data-file="${fileName}"]`);

  const tabs = reportDetailOfFile.querySelectorAll("[data-tab]");
  for (const tab of tabs) {
    tab.classList.add("hidden");
  }
  reportDetailOfFile
    .querySelector(`[data-tab="${activeTabId}"]`)
    .classList.remove("hidden");
};

const fileSelected = (e) => {
  const fileName = e.target.attributes["data-file-name"].value;
  const article = e.currentTarget.parentNode;
  activateTabContent(article, fileName);
  showReportDetail(article, fileName);

  const files = e.target.parentNode.querySelectorAll("[data-file-name]");
  for (const file of files) {
    file.removeAttribute("data-file-active");
  }

  e.target.setAttribute("data-file-active", "true");
};

const showSpinner = () => {
  const spinner = document.querySelector("#spinner");
  spinner.classList.remove("hidden");
};

const hideSpinner = () => {
  const spinner = document.querySelector("#spinner");
  spinner.classList.add("hidden");
};

const clearResults = () => {
  const spinner = document.querySelector("#results");
  spinner.innerHTML = "";
};

const toggleReportVisibility = (e) => {
  const report = e.currentTarget.parentElement.querySelector(".report");
  report.classList.toggle("visible");
};

const lintMap = {
  "id-length": "Identifier/variable names must be long enough to be readable.",
  "no-extra-parens": "Avoid unnecessary parentheses.",
  "max-len": "Try not to write long lines exceeding 80 characters.",
  eqeqeq: "Use strict equality (===) instead of loose equality (==).",
  "max-lines-per-function": "Avoid writing long functions (max: 15)",
  yoda:
    "Avoid using literals on LHS of conditions/comparisons (e.g., `if (5 === x)`).",
  "space-infix-ops": "Add spaces around infix operators.",
  "semi-spacing": "Ensure proper spacing around semicolons.",
  "keyword-spacing":
    "Enforce consistent spacing before and after keywords like `if`, `for`, `while` etc.",
  indent: "Incorrect indentation: indent code with 2 spaces.",
  "prefer-const": "Use `const` for variables that are never reassigned.",
  "no-mixed-operators":
    "Avoid mixing different types of operators without parentheses.",
  "no-multiple-empty-lines": "Avoid multiple empty lines; allow only one.",
  camelcase: "Variable names should be in camelCase.",
  "comma-spacing": "Enforce consistent spacing before and after commas.",
  "no-var": "Use `let` or `const` instead of `var`.",
  curly: "Always use curly braces for control statements.",
  "brace-style": "Enforce consistent brace style for blocks.",
  "no-eval": "Avoid using `eval()`.",
  "no-implicit-globals": "Avoid creating global variables unintentionally.",
  "no-process-exit": "Avoid using `process.exit()` to terminate the process.",
  "no-process-env":
    "Avoid using `process.env` to access environment variables directly.",
  "max-depth": "Limit the depth of nested blocks to a maximum of 3.",
  complexity: "Limit the complexity of functions to a maximum of 4.",
  "no-lone-blocks": "Avoid unnecessary blocks.",
  "no-shadow": "Avoid variable declarations that shadow outer scope variables.",
  "no-unused-expressions": "Avoid unused expressions in your code.",
  "one-var-declaration-per-line":
    "Limit variable declarations to one per line.",
  "no-undefined": "Avoid using `undefined` literals.",
  "no-lonely-if":
    "Avoid `if` statements that are the only statement in a block.",
  "no-unused-vars": "Warn about variables that are declared but not used.",
  "no-nested-ternary": "Avoid using nested ternary operators.",
  "no-multi-spaces": "Avoid multiple spaces in your code.",
  semi: "Always end statements with semi-colons",
};

const registerHandlebarsHelpers = () => {
  Handlebars.registerHelper(
    "hasFailures",
    (tests) => (tests || []).some((test) => !test.pass),
  );
  Handlebars.registerHelper(
    "getFailed",
    (tests) => (tests || []).filter((test) => !test.pass),
  );
  Handlebars.registerHelper("testStatus", (intern) => {
    if (intern.error) return "error";
    if (intern.summary.failed > 0) return "fail";
    return "pass";
  });
  Handlebars.registerHelper("summariseLintIssues", (lintIssues) => {
    return (lintIssues || []).filter((x) => x.ruleId).map((x) =>
      lintMap[x.ruleId]
    );
  });
  Handlebars.registerHelper(
    "stringify",
    (obj) => Object.values(obj).join(" | "),
  );
  Handlebars.registerHelper("percentage", (passed, total) => {
    if (!passed || !total) return "-";
    return ((passed * 100) / total).toFixed(2);
  });
};

const getTemplate = (templateName) =>
  fetch(`/templates/${templateName}`)
    .then((r) => r.text())
    .then((templateContent) => {
      return Handlebars.compile(templateContent);
    });

const render = (template, results) => {
  hideSpinner();
  document.querySelector("#results").innerHTML = template({ results });
  hljs.highlightAll();
};
