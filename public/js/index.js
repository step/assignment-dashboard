// Global variable to store intern data
let internData = [];

// Fetch assignment results from server
const fetchAssignmentResults = async () => {
  try {
    const response = await fetch("/api/assignments/results");
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

// Calculate statistics from intern data
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

const renderStats = (data) => {
  const statsGrid = document.getElementById("statsGrid");
  const template = document.getElementById("statCardTemplate");
  const stats = calculateStats(data);

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
  const filteredData = internData.filter((intern) =>
    intern.name.toLowerCase().includes(searchTerm)
  );
  renderInterns(filteredData);
  // Keep stats at full dataset level - do not update stats on filter
});

// Initialize the application
const initializeApp = async () => {
  try {
    // Show loading state
    showLoading();

    // Fetch assignment results from server
    internData = await fetchAssignmentResults();

    // Hide loading and render data
    hideLoading();
    renderStats(internData);
    renderInterns(internData);
  } catch (_error) {
    hideLoading();
    showError("Failed to load assignment results. Please try again later.");
  }
};

// Run initialization when page loads
document.addEventListener("DOMContentLoaded", initializeApp);
