// Global variable to store assignment data
let assignmentsData = [];
let refreshInterval = null;
let isRefreshing = false;

// Fetch assignments from API
const fetchAssignments = async () => {
  try {
    const response = await fetch("/api/assignments");
    if (!response.ok) {
      throw new Error(`Failed to fetch assignments: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

// Refresh data and update UI
const refreshData = async (showLoadingIndicator = false) => {
  if (isRefreshing) return;

  isRefreshing = true;

  const refreshButton = document.getElementById("refreshButton");

  try {
    // Show loading states
    if (showLoadingIndicator) {
      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.classList.add("loading");
        refreshButton.querySelector("span")?.remove(); // Remove existing text
        refreshButton.appendChild(document.createTextNode("Refreshing..."));
      }
      showLoading();
    }

    // Fetch and transform assignment data
    const apiData = await fetchAssignments();
    const newAssignmentsData = transformAssignmentData(apiData);

    // Check if data has changed
    const dataChanged =
      JSON.stringify(assignmentsData) !== JSON.stringify(newAssignmentsData);

    assignmentsData = newAssignmentsData;

    // Update stats overview
    updateStatsOverview(apiData);

    // Re-render assignments (preserve search filter if active)
    const searchInput = document.getElementById("searchInput");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    if (searchTerm) {
      const filteredData = assignmentsData.filter((assignment) =>
        assignment.name.toLowerCase().includes(searchTerm)
      );
      renderAssignments(filteredData);
    } else {
      renderAssignments(assignmentsData);
    }

    // Update last updated timestamp
    updateLastUpdatedTime();

    // Show notification if data changed and this was an automatic refresh
    if (dataChanged && !showLoadingIndicator) {
      showUpdateNotification();
    }

    if (showLoadingIndicator) {
      hideLoading();
    }
  } catch (error) {
    console.error("Error refreshing data:", error);
    if (showLoadingIndicator) {
      showError("Failed to refresh assignments. Please try again later.");
    }
  } finally {
    isRefreshing = false;

    // Reset refresh button state
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.classList.remove("loading");
      refreshButton.innerHTML = `
        <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
        </svg>
        Refresh
      `;
    }
  }
};

// Show update notification
const showUpdateNotification = () => {
  // Remove existing notification
  const existingNotification = document.getElementById("updateNotification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.id = "updateNotification";
  notification.className = "update-notification";
  notification.innerHTML = `
    <div class="notification-content">
      <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
      <span>Assignment data updated!</span>
      <button class="notification-close">×</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Show with animation
  setTimeout(() => notification.classList.add("show"), 100);

  // Auto-hide after 4 seconds
  const autoHideTimeout = setTimeout(() => {
    hideUpdateNotification();
  }, 4000);

  // Close button functionality
  notification.querySelector(".notification-close").addEventListener(
    "click",
    () => {
      clearTimeout(autoHideTimeout);
      hideUpdateNotification();
    },
  );
};

// Hide update notification
const hideUpdateNotification = () => {
  const notification = document.getElementById("updateNotification");
  if (notification) {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }
};

// Start auto-refresh
const startAutoRefresh = () => {
  // if (refreshInterval) {
  //   clearInterval(refreshInterval);
  // }

  // refreshInterval = setInterval(() => {
  //   refreshData(false); // Don't show loading for automatic refreshes
  // }, REFRESH_INTERVAL_MS);
};

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Update last updated time display
const updateLastUpdatedTime = () => {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const lastUpdatedElement = document.getElementById("lastUpdated");
  if (lastUpdatedElement) {
    lastUpdatedElement.textContent = `Last updated: ${timeString}`;
  }
};
const transformAssignmentData = (apiData) => {
  return apiData.map((assignment) => {
    // Format assignment name from kebab-case to title case
    const formattedName = assignment.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Format date
    const date = new Date(assignment.date);
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
    const lastUpdated = `${formattedDate} at ${formattedTime}`;

    return {
      name: formattedName,
      id: assignment.name,
      lastUpdated: lastUpdated,
      submissions: assignment.totalInterns,
      avgScore: Math.round(assignment.avgScore),
      passRate: Math.round(assignment.passRate),
    };
  });
};

// Update stats overview based on API data
const updateStatsOverview = (apiData) => {
  const totalAssignments = apiData.length;
  const assignmentsWithSubmissions =
    apiData.filter((a) => a.totalInterns > 0).length;
  const assignmentsWithoutSubmissions =
    apiData.filter((a) => a.totalInterns === 0).length;
  const totalSubmissions = apiData.reduce((sum, a) => sum + a.totalInterns, 0);

  // Update the stat cards in the DOM
  const statCards = document.querySelectorAll(".stat-card");
  if (statCards.length >= 4) {
    statCards[0].querySelector(".stat-number").textContent = totalAssignments;
    statCards[1].querySelector(".stat-number").textContent =
      assignmentsWithSubmissions;
    statCards[2].querySelector(".stat-number").textContent =
      assignmentsWithoutSubmissions;
    statCards[3].querySelector(".stat-number").textContent = totalSubmissions;
  }
};

const createAssignmentCard = (assignment) => {
  console.log(assignment);
  // Get the template
  const template = document.getElementById("assignmentCardTemplate");
  const card = template.content.cloneNode(true);

  // Get the card element (the <a> tag)
  const cardElement = card.querySelector(".assignment-card");

  // Populate the template with data
  card.querySelector('[data-field="name"]').textContent = assignment.name;
  card.querySelector('[data-field="lastUpdated"]').textContent =
    assignment.lastUpdated;
  card.querySelector('[data-field="submissions"]').textContent =
    assignment.submissions;
  card.querySelector('[data-field="avgScore"]').textContent =
    `${assignment.avgScore}%`;
  card.querySelector('[data-field="passRate"]').textContent =
    `${assignment.passRate}%`;

  // Add click handler to simulate navigation
  cardElement.addEventListener("click", function (e) {
    e.preventDefault();
    if(window.location.pathname.startsWith("/admin")) {
      globalThis.window.location.assign(`/admin/${assignment.id}`);
      return;  
    }
    globalThis.window.location.assign(`/${assignment.id}/scores.html`);
  });

  return card;
};

// Loading and error handling functions
const showLoading = () => {
  const grid = document.getElementById("assignmentsGrid");
  const noResults = document.getElementById("noResults");

  grid.innerHTML = '<div class="loading-message">Loading assignments...</div>';
  noResults.style.display = "none";
};

const hideLoading = () => {
  // Loading content will be replaced by actual data
};

const showError = (message) => {
  const grid = document.getElementById("assignmentsGrid");
  const noResults = document.getElementById("noResults");

  grid.innerHTML = `<div class="error-message">${message}</div>`;
  noResults.style.display = "none";
};

const renderAssignments = (data) => {
  const grid = document.getElementById("assignmentsGrid");
  const noResults = document.getElementById("noResults");

  grid.innerHTML = "";

  if (data.length === 0) {
    grid.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  noResults.style.display = "none";

  data.forEach((assignment) => {
    console.log(assignment);
    const card = createAssignmentCard(assignment);
    grid.appendChild(card);
  });
};

// Search functionality
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Show loading state
    showLoading();

    // Initial data load
    await refreshData(false);

    // Start auto-refresh
    startAutoRefresh();

    // Hide loading state
    hideLoading();
  } catch (_error) {
    // Show error state
    showError("Failed to load assignments. Please try again later.");
  }

  // Search functionality
  document.getElementById("searchInput").addEventListener(
    "input",
    function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const filteredData = assignmentsData.filter((assignment) =>
        assignment.name.toLowerCase().includes(searchTerm)
      );
      renderAssignments(filteredData);
    },
  );

  // Refresh button functionality
  const refreshButton = document.getElementById("refreshButton");
  if (refreshButton) {
    refreshButton.addEventListener("click", async function () {
      await refreshData(true);
    });
  }

  // Cleanup on page unload
  globalThis.addEventListener("beforeunload", () => {
    stopAutoRefresh();
  });
});
