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

  // Clear existing content
  internList.replaceChildren();

  data.forEach((intern) => {
    // Clone the template content
    const clone = template.content.cloneNode(true);

    // Populate the cloned elements with data
    const nameElement = clone.querySelector('[data-field="name"]');
    const scoreElement = clone.querySelector('[data-field="score"]');
    const issuesElement = clone.querySelector('[data-field="issues"]');

    nameElement.textContent = intern.name;
    scoreElement.textContent = `${intern.score}%`;
    scoreElement.className = `score-badge ${getScoreClass(intern.score)}`;
    issuesElement.textContent = intern.issues;
    issuesElement.className = `hygiene-issues ${
      getHygieneClass(intern.issues)
    }`;

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
  } catch (_error) {
    hideLoading();
    showError("Failed to load assignment results. Please try again later.");
  }
};

// Run initialization when page loads
document.addEventListener("DOMContentLoaded", initializeApp);
