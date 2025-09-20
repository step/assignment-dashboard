// Sample data generation
const internData = [
  { name: "Alice Johnson", score: 92, issues: 1 },
  { name: "Bob Smith", score: 78, issues: 4 },
  { name: "Carol Davis", score: 95, issues: 0 },
  { name: "David Wilson", score: 65, issues: 6 },
  { name: "Emma Brown", score: 88, issues: 2 },
  { name: "Frank Miller", score: 91, issues: 1 },
  { name: "Grace Lee", score: 76, issues: 3 },
  { name: "Henry Taylor", score: 83, issues: 2 },
  { name: "Ivy Chen", score: 94, issues: 1 },
  { name: "Jack Anderson", score: 72, issues: 5 },
  { name: "Kate Rodriguez", score: 89, issues: 2 },
  { name: "Liam O'Connor", score: 86, issues: 3 },
  { name: "Maya Patel", score: 93, issues: 1 },
  { name: "Noah Kim", score: 79, issues: 4 },
  { name: "Olivia Garcia", score: 87, issues: 2 },
  { name: "Paul Martinez", score: 84, issues: 3 },
  { name: "Quinn Thompson", score: 90, issues: 1 },
  { name: "Rachel White", score: 77, issues: 4 },
  { name: "Sam Johnson", score: 85, issues: 2 },
  { name: "Tara Singh", score: 92, issues: 1 },
  { name: "Uma Sharma", score: 88, issues: 2 },
  { name: "Victor Lopez", score: 81, issues: 3 },
  { name: "Wendy Chang", score: 96, issues: 0 },
  { name: "Xavier Nguyen", score: 74, issues: 5 },
  { name: "Yuki Tanaka", score: 89, issues: 2 },
  { name: "Zoe Williams", score: 87, issues: 2 },
  { name: "Adam Foster", score: 91, issues: 1 },
  { name: "Beth Cooper", score: 78, issues: 4 },
  { name: "Chris Evans", score: 85, issues: 3 },
  { name: "Dana Scott", score: 93, issues: 1 },
  { name: "Eric Wang", score: 80, issues: 3 },
  { name: "Fiona Bell", score: 88, issues: 2 },
  { name: "Greg Adams", score: 75, issues: 4 },
  { name: "Hannah Lee", score: 94, issues: 1 },
  { name: "Ian Murphy", score: 82, issues: 3 },
  { name: "Jess Parker", score: 89, issues: 2 },
  { name: "Kyle Davis", score: 86, issues: 2 },
  { name: "Luna Rodriguez", score: 91, issues: 1 },
  { name: "Matt Wilson", score: 77, issues: 4 },
  { name: "Nina Patel", score: 90, issues: 2 },
  { name: "Owen Clark", score: 84, issues: 3 },
  { name: "Priya Gupta", score: 92, issues: 1 },
  { name: "Ryan Turner", score: 79, issues: 4 },
  { name: "Sara Kim", score: 87, issues: 2 },
  { name: "Tom Baker", score: 85, issues: 3 },
  { name: "Vera Chen", score: 94, issues: 1 },
  { name: "Will Jones", score: 81, issues: 3 },
  { name: "Xara Ahmed", score: 88, issues: 2 },
  { name: "Yuki Sato", score: 90, issues: 1 },
  { name: "Zara Ali", score: 86, issues: 2 },
  { name: "Alex Carter", score: 83, issues: 3 },
  { name: "Bella Ross", score: 91, issues: 1 },
  { name: "Carl Jensen", score: 76, issues: 4 },
  { name: "Delia Moore", score: 89, issues: 2 },
  { name: "Ethan Brooks", score: 87, issues: 2 },
  { name: "Faye Collins", score: 92, issues: 1 },
  { name: "Gary Hill", score: 78, issues: 4 },
  { name: "Hina Shah", score: 95, issues: 0 },
  { name: "Isaac Reed", score: 84, issues: 3 },
  { name: "Jade Wong", score: 88, issues: 2 },
  { name: "Kevin Liu", score: 85, issues: 3 },
  { name: "Lisa Green", score: 90, issues: 1 },
  { name: "Mike Torres", score: 82, issues: 3 },
  { name: "Nora Phillips", score: 93, issues: 1 },
  { name: "Oscar Rivera", score: 79, issues: 4 },
  { name: "Penny Cox", score: 87, issues: 2 },
  { name: "Quincy Ward", score: 91, issues: 1 },
];

function getScoreClass(score) {
  if (score >= 80) return "score-pass";
  if (score >= 70) return "score-warning";
  return "score-fail";
}

function getHygieneClass(issues) {
  if (issues === 0) return "hygiene-low";
  if (issues <= 2) return "hygiene-low";
  if (issues <= 4) return "hygiene-medium";
  return "hygiene-high";
}

function renderInterns(data) {
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
}

// Search functionality
document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredData = internData.filter((intern) =>
    intern.name.toLowerCase().includes(searchTerm)
  );
  renderInterns(filteredData);
});

// Initial render
renderInterns(internData);
