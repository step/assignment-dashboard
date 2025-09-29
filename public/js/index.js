// Global variable to store intern data
let assignmentResult = [];

// Function to format assignment name from URL
const formatAssignmentName = (assignmentId) => {
  // Convert kebab-case to Title Case
  return assignmentId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Function to update assignment title
const updateAssignmentTitle = () => {
  const assignmentId = globalThis.location.pathname.split("/")[1];
  const titleElement = document.getElementById("assignmentTitle");
  const pageTitleElement = document.getElementById("pageTitle");

  if (assignmentId) {
    const formattedName = formatAssignmentName(assignmentId);
    if (titleElement) {
      titleElement.textContent = formattedName;
    }
    if (pageTitleElement) {
      pageTitleElement.textContent = `${formattedName} - Results`;
    }
  }
};

// Function to format and update last updated time
const updateLastUpdated = (stats) => {
  const lastUpdatedElement = document.getElementById("lastUpdated");
  if (lastUpdatedElement && stats && stats.date) {
    const date = new Date(stats.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    lastUpdatedElement.textContent =
      `Last updated: ${formattedDate} at ${formattedTime}`;
  }
};

// Fetch assignment results from server
const fetchAssignmentResults = async () => {
  const assignmentId = globalThis.location.pathname.split("/")[1];
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/results`);
    if (!response.ok) {
      throw new Error(`Failed to fetch assignment results: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching assignment results:", error);
    throw error;
  }
};

// Loading and error handling functions
const showLoading = () => {
  const statsGrid = document.getElementById("statsGrid");
  const internList = document.getElementById("internList");

  statsGrid.innerHTML =
    '<div class="loading-message">Loading statistics...</div>';
  internList.innerHTML =
    '<div class="loading-message">Loading assignment results...</div>';
};

const hideLoading = () => {
  // Loading content will be replaced by actual data
};

const showError = (message) => {
  const statsGrid = document.getElementById("statsGrid");
  const internList = document.getElementById("internList");

  statsGrid.innerHTML = `<div class="error-message">${message}</div>`;
  internList.innerHTML = `<div class="error-message">${message}</div>`;
};

const getScoreClass = (score) => {
  if (score >= 80) return "score-pass";
  if (score >= 70) return "score-warning";
  return "score-fail";
};

const getHygieneClass = (issues) => {
  if (issues === 0) return "hygiene-low";
  if (issues <= 2) return "hygiene-low";
  if (issues <= 4) return "hygiene-medium";
  return "hygiene-high";
};

// Function to format problem names for display
const formatProblemName = (problemName) => {
  return problemName
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Function to render problem headers
const renderProblemHeaders = (problems) => {
  const problemHeaders = document.getElementById("problemHeaders");

  if (!problems || problems.length === 0) {
    problemHeaders.style.display = "none";
    return;
  }

  problemHeaders.style.display = "grid";

  // Create the structure: empty space for name and overall columns, then problem headers
  problemHeaders.innerHTML = `
    <div></div>
    <div></div>
    <div class="problem-headers-grid">
      ${
    problems.map((problem) =>
      `<div class="problem-header">${formatProblemName(problem.name)}</div>`
    ).join("")
  }
    </div>
  `;
};

// Function to sort interns by score (highest first)
const sortInternsByScore = (interns) => {
  return [...interns].sort((a, b) => b.score - a.score);
};

// Function to convert scores data to markdown table
const scoresToMarkdownTable = (scores) => {
  if (!scores || scores.length === 0) {
    return "No scores data available.";
  }

  // Sort scores by score (highest first)
  const sortedScores = sortInternsByScore(scores);

  // Create header with problem columns
  let markdown = "| Intern | Overall Score | Overall Issues |";

  // Add problem headers if we have problem data
  if (
    sortedScores.length > 0 && sortedScores[0].problems &&
    sortedScores[0].problems.length > 0
  ) {
    sortedScores[0].problems.forEach((_, index) => {
      markdown += ` Problem ${index + 1} % |`;
    });
  }

  markdown += "\n|--------|---------------|----------------|";

  // Add problem header separators
  if (
    sortedScores.length > 0 && sortedScores[0].problems &&
    sortedScores[0].problems.length > 0
  ) {
    sortedScores[0].problems.forEach(() => {
      markdown += "----------------|";
    });
  }

  markdown += "\n";

  sortedScores.forEach((intern) => {
    markdown += `| ${intern.name} | ${intern.score}% | ${intern.issues} |`;

    // Add individual problem data if available
    if (intern.problems && intern.problems.length > 0) {
      intern.problems.forEach((problem) => {
        markdown += ` ${problem.percentage}% |`;
      });
    }

    markdown += "\n";
  });

  return markdown;
};

// Function to copy scores as markdown table
const copyScoresAsMarkdown = async () => {
  try {
    if (!assignmentResult || !assignmentResult.scores) {
      alert("No scores data available to copy.");
      return;
    }

    const markdownTable = scoresToMarkdownTable(assignmentResult.scores);

    await navigator.clipboard.writeText(markdownTable);
    alert("Scores copied as markdown table to clipboard!");
  } catch (error) {
    console.error("Failed to copy scores:", error);
    alert("Failed to copy scores to clipboard. Please try again.");
  }
};

const renderStats = (stats) => {
  const statsGrid = document.getElementById("statsGrid");
  const template = document.getElementById("statCardTemplate");

  // Clear existing content
  statsGrid.replaceChildren();

  // Define the stats to display
  const statsToDisplay = [
    { value: stats.totalInterns, label: "Total Interns" },
    { value: `${stats.passRate}%`, label: "Pass Rate" },
    { value: stats.avgIssues, label: "Avg Issues" },
    { value: `${stats.avgScore}%`, label: "Avg Score" },
  ];

  // Render each stat card
  statsToDisplay.forEach((stat) => {
    const clone = template.content.cloneNode(true);

    const valueElement = clone.querySelector('[data-field="value"]');
    const labelElement = clone.querySelector('[data-field="label"]');

    valueElement.textContent = stat.value;
    labelElement.textContent = stat.label;

    statsGrid.appendChild(clone);
  });
};

const renderInterns = (data) => {
  const internList = document.getElementById("internList");
  const template = document.getElementById("internRowTemplate");
  const problemTemplate = document.getElementById("problemStatsTemplate");

  // Clear existing content
  internList.replaceChildren();

  // Sort data by score (highest first) before rendering
  const sortedData = sortInternsByScore(data);

  // Render problem headers if we have data
  if (sortedData.length > 0 && sortedData[0].problems) {
    renderProblemHeaders(sortedData[0].problems);
  }

  sortedData.forEach((intern) => {
    // Clone the template content
    const clone = template.content.cloneNode(true);

    // Populate the cloned elements with data
    const nameElement = clone.querySelector('[data-field="name"]');
    const scoreElement = clone.querySelector('[data-field="score"]');
    const issuesElement = clone.querySelector('[data-field="issues"]');
    const problemsContainer = clone.querySelector('[data-field="problems"]');

    nameElement.textContent = intern.name;
    scoreElement.textContent = `${intern.score}%`;
    scoreElement.className = `score-badge ${getScoreClass(intern.score)}`;
    issuesElement.textContent = intern.issues;
    issuesElement.className = `hygiene-issues ${
      getHygieneClass(intern.issues)
    }`;

    // Render individual problem stats
    if (intern.problems && intern.problems.length > 0) {
      intern.problems.forEach((problem) => {
        const problemClone = problemTemplate.content.cloneNode(true);
        const problemScoreElement = problemClone.querySelector(
          '[data-field="percentage"]',
        );

        problemScoreElement.textContent = `${problem.percentage}%`;
        problemScoreElement.className = `problem-score ${
          getScoreClass(problem.percentage)
        }`;

        problemsContainer.appendChild(problemClone);
      });
    } else {
      // If no problem data, show placeholder
      problemsContainer.innerHTML =
        '<div class="no-problem-data">No problem data available</div>';
    }

    internList.appendChild(clone);
  });
};

// Search functionality
document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredData = assignmentResult.scores.filter((intern) =>
    intern.name.toLowerCase().includes(searchTerm)
  );
  renderInterns(filteredData);
  // Keep stats at full dataset level - do not update stats on filter
});

// Initialize the application
const initializeApp = async () => {
  try {
    // Update assignment title immediately
    updateAssignmentTitle();

    // Show loading state
    showLoading();

    assignmentResult = await fetchAssignmentResults();

    // Hide loading and render data
    hideLoading();
    updateLastUpdated(assignmentResult.stats);
    renderStats(assignmentResult.stats);
    renderInterns(assignmentResult.scores);

    // Add event listener for copy markdown button
    const copyButton = document.getElementById("copyMarkdownScores");
    if (copyButton) {
      copyButton.addEventListener("click", copyScoresAsMarkdown);
    }
  } catch (_error) {
    hideLoading();
    showError("Failed to load assignment results. Please try again later.");
  }
};

// Run initialization when page loads
document.addEventListener("DOMContentLoaded", initializeApp);
