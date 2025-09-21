import { githubIds } from "../../config/github_ids.js";

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
  const githubUsername = githubIds.find((id) => repo.endsWith(id));
  if (!githubUsername) {
    return null;
  }
  const assignmentName = repo.replace(`-${githubUsername}`, "");
  return { organization, repo, githubUsername, assignmentName };
};

const updateRepo = async (fullName) => {
  const repoDetails = getRepoDetails(fullName);
  if (!repoDetails) return;
  const { organization, repo, githubUsername, assignmentName } = repoDetails;

  await Deno.mkdir(`./source/${assignmentName}`, { recursive: true });
  const code = await fetchRepo(organization, repo);
  await Deno.writeFile(
    `./source/${assignmentName}/${githubUsername}.zip`,
    new Uint8Array(code),
  );
  console.log(`Updated repository: ${fullName}`);
};

export const handleWebhook = async (c) => {
  const payload = await c.req.json();
  const { repository: { full_name } } = payload;
  updateRepo(full_name);
  return c.json({ message: `Received webhook for repository: ${name}` });
};
