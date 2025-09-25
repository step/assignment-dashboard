// Global variables
let internsData = [];
let currentFile = null;
let currentTab = "tests";
let currentIntern = null;
let assignmentId = null;

function init() {
  extractAssignmentId();
  if (assignmentId) {
    fetchInternData();
  } else {
    console.error("Assignment ID not found in URL");
  }
  setupSearch();
}

function extractAssignmentId() {
  // Extract assignment ID from URL path like /admin/js-assignment-1
  const pathParts = globalThis.location.pathname.split("/");
  const adminIndex = pathParts.indexOf("admin");
  if (adminIndex !== -1 && pathParts.length > adminIndex + 1) {
    assignmentId = pathParts[adminIndex + 1];
  }
}

async function fetchInternData() {
  try {
    const response = await fetch(`/api/admin/${assignmentId}/score`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    internsData = mapApiDataToInternData(data);
    renderInternList();
    updateHeaderStats();
  } catch (error) {
    console.error("Error fetching intern data:", error);
    // Show error message to user
    const internList = document.getElementById("intern-list");
    internList.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #dc3545;">
        <h3>Error loading assignment data</h3>
        <p>Failed to load data for assignment: ${assignmentId}</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

function mapApiDataToInternData(apiData) {
  return apiData.map((intern) => ({
    name: intern.name,
    score: intern.summary.percentage,
    issues: intern.summary.lintErrors,
    total: intern.summary.total,
    passed: intern.summary.passed,
    failed: intern.summary.failed,
    results: intern.results, // Keep full results for detailed view
  }));
}

function updateHeaderStats() {
  if (internsData.length === 0) return;

  const totalInterns = internsData.length;
  const passedInterns =
    internsData.filter((intern) => intern.score >= 60).length; // Assuming 60% is passing
  const passRate = Math.round((passedInterns / totalInterns) * 100);
  const avgIssues =
    (internsData.reduce((sum, intern) => sum + intern.issues, 0) / totalInterns)
      .toFixed(1);
  const avgScore = Math.round(
    internsData.reduce((sum, intern) => sum + intern.score, 0) / totalInterns,
  );

  // Update page title and header
  const assignmentTitle = formatAssignmentTitle(assignmentId);
  document.title = assignmentTitle;
  const headerTitle = document.querySelector(".header h1");
  if (headerTitle) {
    headerTitle.textContent = assignmentTitle;
  }

  // Update header stats
  const stats = document.querySelectorAll(".stat-value");
  if (stats.length >= 4) {
    stats[0].textContent = totalInterns;
    stats[1].textContent = `${passRate}%`;
    stats[2].textContent = avgIssues;
    stats[3].textContent = `${avgScore}%`;
  }

  // Update last updated time
  const headerInfo = document.querySelector(".header-info");
  if (headerInfo) {
    const now = new Date();
    headerInfo.textContent =
      `Last updated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
  }
}

function formatAssignmentTitle(assignmentId) {
  if (!assignmentId) return "Assignment Dashboard";

  // Convert kebab-case to title case
  return assignmentId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") + " Assignment";
}

function renderInternList() {
  const internList = document.getElementById("intern-list");
  internList.innerHTML = "";

  // Sort interns by score in descending order
  const sortedInterns = [...internsData].sort((a, b) => b.score - a.score);

  sortedInterns.forEach((intern) => {
    const row = document.createElement("div");
    row.className = "intern-row";
    row.onclick = () => openInternDetails(intern);

    const scoreClass = intern.score >= 90
      ? "high"
      : intern.score >= 75
      ? "medium"
      : "low";
    const issuesClass = intern.issues === 0 ? "none" : "";

    row.innerHTML = `
            <div class="intern-name">${intern.name}</div>
            <div class="intern-stats">
                <div class="score ${scoreClass}">${intern.score}%</div>
                <div class="issues ${issuesClass}">${intern.issues}</div>
            </div>
        `;

    internList.appendChild(row);
  });
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll(".intern-row");

    rows.forEach((row) => {
      const name = row.querySelector(".intern-name").textContent.toLowerCase();
      row.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

function openInternDetails(intern) {
  currentIntern = intern;

  // Update intern details in header
  document.getElementById("intern-details-name").textContent =
    `${intern.name} - ${assignmentId} Assignment`;
  document.getElementById("intern-score").textContent = `${intern.score}%`;
  document.getElementById("intern-issues").textContent = intern.issues;

  // Show assignment details view
  document.getElementById("main-view").style.display = "none";
  document.getElementById("assignment-details").style.display = "block";

  // Update file list based on intern's results
  updateFileList();

  // Update content for the current intern
  updateContent();
}

function updateFileList() {
  if (!currentIntern || !currentIntern.results) return;

  const fileList = document.querySelector(".file-list");
  fileList.innerHTML = "";

  currentIntern.results.forEach((result, index) => {
    const button = document.createElement("button");
    button.className = `file-item ${index === 0 ? "active" : ""}`;
    button.textContent = `${result.name}.js`;
    button.onclick = () => selectFile(result.name);
    fileList.appendChild(button);
  });

  // Update sidebar header with assignment name
  const sidebarTitle = document.querySelector(".sidebar-title");
  const assignmentName = document.querySelector(".assignment-name");
  if (sidebarTitle) {
    sidebarTitle.textContent = "Assignment Files";
  }
  if (assignmentName) {
    assignmentName.textContent = formatAssignmentTitle(assignmentId);
  }

  // Set the first file as current if available
  if (currentIntern.results.length > 0) {
    currentFile = currentIntern.results[0].name;
  }
}

function goBack() {
  document.getElementById("assignment-details").style.display = "none";
  document.getElementById("main-view").style.display = "block";
}

function selectFile(fileName) {
  currentFile = fileName;

  // Update active file
  document.querySelectorAll(".file-item").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.classList.add("active");

  // Update content based on file and current tab
  updateContent();
}

function selectTab(tabName) {
  currentTab = tabName;

  // Update active tab
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  // Show/hide content
  document.querySelectorAll('[id$="-content"]').forEach((content) => {
    content.style.display = "none";
  });
  document.getElementById(tabName + "-content").style.display = "block";

  updateContent();
}

function updateContent() {
  if (!currentIntern) return;

  if (currentTab === "tests") {
    updateTestsContent();
  } else if (currentTab === "lint") {
    updateLintContent();
  } else if (currentTab === "code") {
    updateCodeContent();
  }
}

function formatTestValue(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[] (empty array)";
    }
    return value.join("\n");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function updateTestsContent() {
  const testsContent = document.getElementById("tests-content");

  if (!currentIntern || !currentIntern.results) {
    testsContent.innerHTML = "<p>No test data available</p>";
    return;
  }

  // Find the current file's results
  const fileResult = currentIntern.results.find((result) =>
    result.name === currentFile
  );
  if (!fileResult) {
    testsContent.innerHTML = "<p>No tests found for this file</p>";
    return;
  }

  // Check if there's a compilation error
  if (fileResult.error) {
    testsContent.innerHTML = `
      <div class="test-result failing">
        <div class="test-name">Compilation Error</div>
        <div class="test-description">The code could not be executed due to a compilation error.</div>
        <div class="value-box" style="margin-top: 1rem;">
          <div class="value-label">Error</div>
          <div class="value-content" style="color: #dc3545; font-weight: 600;">${fileResult.error}</div>
        </div>
      </div>
    `;
    return;
  }

  if (!fileResult.tests || fileResult.tests.length === 0) {
    testsContent.innerHTML = "<p>No tests found for this file</p>";
    return;
  }

  // Sort tests to show failing tests first
  const sortedTests = [...fileResult.tests].sort((a, b) => {
    // If one test passes and the other fails, show failing first
    if (a.pass !== b.pass) {
      return a.pass ? 1 : -1; // false (failing) comes before true (passing)
    }
    // If both have same pass status, maintain original order
    return 0;
  });

  let testsHtml = "";
  sortedTests.forEach((test) => {
    const testClass = test.pass ? "passing" : "failing";

    if (test.pass) {
      testsHtml += `
        <div class="test-result ${testClass}">
          <div class="test-name">${test.desc || "Test passed"}</div>
          <div style="text-align: center; color: #28a745; font-weight: 600;">✓ Test Passed</div>
        </div>
      `;
    } else {
      testsHtml += `
        <div class="test-result ${testClass}">
          <div class="test-name">${test.desc || "Test failed"}</div>
          <div class="test-values">
            <div class="value-box">
              <div class="value-label">Expected</div>
              <div class="value-content">${formatTestValue(test.expected)}</div>
            </div>
            <div class="value-box">
              <div class="value-label">Actual</div>
              <div class="value-content">${formatTestValue(test.actual)}</div>
            </div>
          </div>
        </div>
      `;
    }
  });

  testsContent.innerHTML = testsHtml || "<p>No test results available</p>";
}

function updateLintContent() {
  const lintContent = document.getElementById("lint-content");

  if (!currentIntern || !currentIntern.results) {
    lintContent.innerHTML = "<p>No lint data available</p>";
    return;
  }

  // Find the current file's results
  const fileResult = currentIntern.results.find((result) =>
    result.name === currentFile
  );
  if (!fileResult) {
    lintContent.innerHTML = "<p>No lint data found for this file</p>";
    return;
  }

  if (!fileResult.lintIssues || fileResult.lintIssues.length === 0) {
    lintContent.innerHTML = `
      <div class="success-message">
        <div class="success-icon">✅</div>
        <h3>No lint issues found!</h3>
        <p>The code in ${currentFile}.js follows all linting rules.</p>
      </div>
    `;
    return;
  }

  let issuesHtml = "";
  fileResult.lintIssues.forEach((issue) => {
    // Map severity number to text and CSS class
    // In ESLint: 1 = warning, 2 = error
    const isError = issue.severity === 2;
    const severityClass = isError ? "severity-error" : "severity-warning";
    const severityText = isError ? "ERROR" : "WARNING";

    issuesHtml += `
      <div class="lint-issue">
        <span class="lint-severity ${severityClass}">${severityText}</span>
        <div class="lint-message">${issue.message}</div>
        <div class="lint-location">${currentFile}.js - line ${issue.line}, column ${issue.column}</div>
      </div>
    `;
  });

  lintContent.innerHTML = issuesHtml;
}

function updateCodeContent() {
  const codeContent = document.getElementById("code-content");

  if (!currentIntern || !currentIntern.results) {
    codeContent.innerHTML = "<p>No code available</p>";
    return;
  }

  // Find the current file's results
  const fileResult = currentIntern.results.find((result) =>
    result.name === currentFile
  );
  if (!fileResult || !fileResult.code) {
    codeContent.innerHTML = "<p>No code found for this file</p>";
    return;
  }

  // Escape HTML in the code content
  const escapedCode = fileResult.code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  codeContent.innerHTML = `
    <div class="code-container">
      <pre class="line-numbers"><code class="language-javascript">${escapedCode}</code></pre>
    </div>
  `;

  // Trigger Prism.js syntax highlighting for the new content
  if (typeof Prism !== "undefined") {
    Prism.highlightAllUnder(codeContent);
  }
}

// Generate comprehensive markdown report
function generateMarkdownReport() {
  if (!internsData || internsData.length === 0) {
    alert("No data available to generate report");
    return;
  }

  const assignmentTitle = formatAssignmentTitle(assignmentId);
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate overall statistics
  const totalInterns = internsData.length;
  const passedInterns =
    internsData.filter((intern) => intern.score >= 60).length;
  const passRate = Math.round((passedInterns / totalInterns) * 100);
  const avgScore = Math.round(
    internsData.reduce((sum, intern) => sum + intern.score, 0) / totalInterns,
  );

  // Calculate total failing tests and lint issues
  const totalFailingTests = internsData.reduce(
    (sum, intern) => sum + intern.failed,
    0,
  );
  const totalLintIssues = internsData.reduce(
    (sum, intern) => sum + intern.issues,
    0,
  );

  let markdown = `# ${assignmentTitle} - Assessment Report\n\n`;
  markdown += `**Generated on:** ${reportDate}\n\n`;

  // Overall Summary
  markdown += `## 📊 Overall Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Interns | ${totalInterns} |\n`;
  markdown += `| Pass Rate | ${passRate}% |\n`;
  markdown += `| Average Score | ${avgScore}% |\n`;
  markdown += `| Total Failing Tests | ${totalFailingTests} |\n`;
  markdown += `| Total Lint Issues | ${totalLintIssues} |\n\n`;

  // Individual Intern Scores
  markdown += `## 👥 Individual Intern Performance\n\n`;
  markdown +=
    `| Rank | Intern Name | Score | Tests Passed | Tests Failed | Lint Issues |\n`;
  markdown +=
    `|------|-------------|-------|--------------|--------------|-------------|\n`;

  const sortedInterns = [...internsData].sort((a, b) => b.score - a.score);
  sortedInterns.forEach((intern, index) => {
    // Create anchor-friendly name for linking
    const anchorName = intern.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const internNameLink = `[${intern.name}](#${anchorName})`;
    
    markdown += `| ${
      index + 1
    } | ${internNameLink} | ${intern.score}% | ${intern.passed} | ${intern.failed} | ${intern.issues} |\n`;
  });

  markdown += `\n`;

  // Detailed Lint Issues Section
  markdown += `## 🔍 Detailed Lint Issues\n\n`;

  let hasLintIssues = false;

  sortedInterns.forEach((intern) => {
    if (!intern.results || intern.results.length === 0) return;

    // Check if this intern has any lint issues
    const internHasIssues = intern.results.some((result) =>
      result.lintIssues && result.lintIssues.length > 0
    );

    if (internHasIssues) {
      hasLintIssues = true;
      // Create anchor-friendly name for linking
      const anchorName = intern.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      markdown += `### ${intern.name} {#${anchorName}}\n\n`;

      intern.results.forEach((result) => {
        if (result.lintIssues && result.lintIssues.length > 0) {
          markdown += `#### ${result.name}.js\n\n`;

          result.lintIssues.forEach((issue) => {
            const severity = issue.severity === 2 ? "🔴 ERROR" : "🟡 WARNING";
            markdown +=
              `- **${severity}** (Line ${issue.line}, Column ${issue.column}): ${issue.message}\n`;
          });

          markdown += `\n`;
        }
      });

      markdown += `---\n\n`;
    }
  });

  if (!hasLintIssues) {
    markdown += `✅ **No lint issues found across all submissions!**\n\n`;
  }

  // Performance Insights
  markdown += `## 💡 Performance Insights\n\n`;

  const highPerformers = sortedInterns.filter((intern) => intern.score >= 90);
  const lowPerformers = sortedInterns.filter((intern) => intern.score < 60);
  const mostCommonIssues = getMostCommonLintIssues(sortedInterns);

  if (highPerformers.length > 0) {
    markdown += `### 🌟 Top Performers (≥90%)\n`;
    highPerformers.forEach((intern) => {
      markdown +=
        `- **${intern.name}**: ${intern.score}% (${intern.issues} lint issues)\n`;
    });
    markdown += `\n`;
  }

  if (lowPerformers.length > 0) {
    markdown += `### ⚠️ Need Attention (<60%)\n`;
    lowPerformers.forEach((intern) => {
      markdown +=
        `- **${intern.name}**: ${intern.score}% (${intern.failed} failed tests, ${intern.issues} lint issues)\n`;
    });
    markdown += `\n`;
  }

  if (mostCommonIssues.length > 0) {
    markdown += `### 🔄 Most Common Lint Issues\n`;
    mostCommonIssues.forEach((issue, index) => {
      markdown += `${
        index + 1
      }. **${issue.message}** (${issue.count} occurrences)\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n`;
  markdown += `*Report generated automatically by Assignment Dashboard*`;

  // Copy to clipboard
  copyToClipboard(markdown);
}

// Helper function to get most common lint issues
function getMostCommonLintIssues(interns) {
  const issueCount = {};

  interns.forEach((intern) => {
    if (intern.results) {
      intern.results.forEach((result) => {
        if (result.lintIssues) {
          result.lintIssues.forEach((issue) => {
            const key = issue.message;
            issueCount[key] = (issueCount[key] || 0) + 1;
          });
        }
      });
    }
  });

  return Object.entries(issueCount)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 most common issues
}

// Copy text to clipboard with user feedback
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification("Report copied to clipboard!", "success");
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      showNotification("Report copied to clipboard!", "success");
    } catch (_err) {
      showNotification("Failed to copy report. Please try again.", "error");
    }

    document.body.removeChild(textArea);
  }
}

// Show notification to user
function showNotification(message, type = "info") {
  // Remove any existing notification
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 10000;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-size: 14px;
    max-width: 350px;
  `;

  // Set colors based on type
  if (type === "success") {
    notification.style.background = "#28a745";
    notification.style.color = "white";
  } else if (type === "error") {
    notification.style.background = "#dc3545";
    notification.style.color = "white";
  } else {
    notification.style.background = "#007bff";
    notification.style.color = "white";
  }

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
    notification.style.opacity = "1";
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  init();

  // Initialize Prism.js for any existing code blocks
  if (typeof Prism !== "undefined") {
    Prism.highlightAll();
  }
});

setInterval(() => {
  globalThis.location.reload();
}, 60 * 1000);
