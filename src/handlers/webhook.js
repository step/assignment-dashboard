import { githubIds } from "../../config/github_ids.js";
import { evaluateAssignment } from "./assignment.js";

const fetchRepo = async (organization, repo) => {
  const codeUrl =
    `https://api.github.com/repos/${organization}/${repo}/zipball/main`;
  const response = await fetch(codeUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${Deno.env.get("GITHUB_TOKEN")}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return response.arrayBuffer();
};

const getRepoDetails = (fullName) => {
  const [organization, repo] = fullName.split("/");
  const githubUsername = githubIds.map(({ id }) => id).find((id) =>
    fullName.endsWith(`-${id}`)
  );
  const assignmentName = repo.replace(`-${githubUsername}`, "");
  return { organization, assignmentName };
};

const fetchRepos = async (organization, assignmentName) => {
  return await Promise.all(githubIds.map(async ({ id }) => {
    const code = await fetchRepo(organization, `${assignmentName}-${id}`);
    await Deno.writeFile(
      `./source/${assignmentName}/${id}.zip`,
      new Uint8Array(code),
    );
  }));
};

// Updating all the repo for the assignment as deno deploy may change the underlying machine due to which previous repos may be lost
const updateRepo = async (fullName, store) => {
  const repoDetails = getRepoDetails(fullName);
  const { organization, assignmentName } = repoDetails;

  await Deno.mkdir(`./source/${assignmentName}`, { recursive: true });
  await fetchRepos(organization, assignmentName);
  evaluateAssignment(assignmentName, store);
};

class ReportUpdateScheduler {
  constructor(store, interval) {
    this.buffer = new Set();
    this.store = store;
    this.interval = interval;
    this.isProcessing = false;
    this.run();
  }

  run() {
    setInterval(() => {
      const reposToUpdate = new Array(...this.buffer);
      console.log(`Starting update for ${reposToUpdate.length} repositories`);
      // reposToUpdate.forEach((repoFullName) => {
      if (reposToUpdate.length === 0) return;
      console.log(`Processing update for ${reposToUpdate[0]}`);
      updateRepo(reposToUpdate[0], this.store);
      this.buffer.clear();
    }, this.interval);
  }

  scheduleUpdate(repoFullName) {
    const { id } = githubIds.find(({ id }) => repoFullName.endsWith(`-${id}`));
    console.log(`Scheduling update for ${repoFullName.replace(`-${id}`, "")}`);
    this.buffer.add(repoFullName.replace(`-${id}`, ""));
  }
}

let scheduler;

export const handleWebhook = async (c, store) => {
  const payload = await c.req.json();
  const { repository: { full_name } } = payload;
  if (full_name === "step-batch-11/js-functions-1-pradipta1023") {
    return c.json({ message: "Ignoring test repository webhook" });
  }
  if (!scheduler) {
    scheduler = new ReportUpdateScheduler(store, 1000); // 2 minutes interval
  }
  scheduler.scheduleUpdate(full_name);
  return c.json({ message: `Received webhook for repository: ${full_name}` });
};
