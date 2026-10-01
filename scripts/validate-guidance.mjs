import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const requiredAgents = ["AGENTS.md", "src/AGENTS.md", "src-tauri/AGENTS.md", "docs/AGENTS.md", "skills/AGENTS.md"];
const requiredSkills = [
  "develop-frontend-explorer",
  "develop-native-scanner",
  "maintain-project-guidance",
  "research-agent-formats",
];
const failures = [];

async function read(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`${relativePath}: ${error.message}`);
    return "";
  }
}

for (const relativePath of requiredAgents) {
  const content = await read(relativePath);
  if (content && !content.trimStart().startsWith("#")) {
    failures.push(`${relativePath}: expected a Markdown heading`);
  }
}

const skillDirectories = await readdir(path.join(root, "skills"), { withFileTypes: true });
const discoveredSkills = skillDirectories
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const requiredSkill of requiredSkills) {
  if (!discoveredSkills.includes(requiredSkill)) {
    failures.push(`skills/: missing required skill ${requiredSkill}`);
  }
}

for (const skillName of discoveredSkills) {
  const manifestPath = `skills/${skillName}/SKILL.md`;
  const manifest = await read(manifestPath);
  const frontmatter = manifest.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    failures.push(`${manifestPath}: missing YAML front matter`);
    continue;
  }
  if (!new RegExp(`^name:\\s*["']?${skillName}["']?\\s*$`, "m").test(frontmatter[1])) {
    failures.push(`${manifestPath}: name must match its directory`);
  }
  if (!/^description:\s*.+$/m.test(frontmatter[1])) {
    failures.push(`${manifestPath}: missing description`);
  }
  if (/TODO|\[TODO/i.test(manifest)) {
    failures.push(`${manifestPath}: unfinished placeholder`);
  }

  const interfacePath = `skills/${skillName}/agents/openai.yaml`;
  const interfaceConfig = await read(interfacePath);
  if (!interfaceConfig.includes(`$${skillName}`)) {
    failures.push(`${interfacePath}: default_prompt must mention $${skillName}`);
  }
}

const maintenance = await read("docs/MAINTENANCE.md");
for (const requiredPath of ["README.md", "docs/FORMAT-RESEARCH.md", "docs/ARCHITECTURE.md", "docs/MVP.md"]) {
  if (!maintenance.includes(requiredPath)) {
    failures.push(`docs/MAINTENANCE.md: missing ${requiredPath}`);
  }
}

if (failures.length) {
  console.error(`Guidance validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Guidance validation passed (${requiredAgents.length} scopes, ${discoveredSkills.length} skills).`);
