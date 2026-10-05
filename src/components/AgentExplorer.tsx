import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, File, FileKey2, FileText, Folder, Network, Sparkles } from "lucide-react";
import type { AgentNode, ProjectEntry, SkillDefinition } from "../model";

interface Props {
  entries: ProjectEntry[];
  agents: AgentNode[];
  skills: SkillDefinition[];
  selectedId?: string;
  onSelectAgent: (agent: AgentNode) => void;
  onSelectSkill: (skill: SkillDefinition) => void;
  onSelectMarkdown: (entry: ProjectEntry) => void;
  onSelectOverview: () => void;
}

interface EntryNode extends ProjectEntry {
  name: string;
  children: EntryNode[];
}

function buildTree(entries: ProjectEntry[]): EntryNode[] {
  const nodes = new Map<string, EntryNode>();
  for (const entry of entries) {
    nodes.set(entry.relativePath, {
      ...entry,
      name: entry.relativePath.split("/").at(-1) ?? entry.relativePath,
      children: [],
    });
  }

  const roots: EntryNode[] = [];
  for (const node of nodes.values()) {
    const parentPath = node.relativePath.split("/").slice(0, -1).join("/");
    const parent = nodes.get(parentPath);
    if (parent?.kind === "directory") parent.children.push(node);
    else roots.push(node);
  }

  const sort = (items: EntryNode[]) => {
    items.sort((left, right) =>
      left.kind === right.kind
        ? left.name.localeCompare(right.name)
        : left.kind === "directory" ? -1 : 1
    );
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

function branchContainsGuidance(
  node: EntryNode,
  agentByPath: Map<string, AgentNode>,
  skillByPath: Map<string, SkillDefinition>,
): boolean {
  return Boolean(
    agentByPath.has(node.relativePath) ||
    skillByPath.has(node.relativePath) ||
    (node.kind === "file" && node.relativePath.toLowerCase().endsWith(".md")) ||
    node.children.some((child) => branchContainsGuidance(child, agentByPath, skillByPath))
  );
}

function EntryBranch({
  node,
  depth,
  showAll,
  agentByPath,
  skillByPath,
  selectedId,
  onSelectAgent,
  onSelectSkill,
  onSelectMarkdown,
}: {
  node: EntryNode;
  depth: number;
  showAll: boolean;
  agentByPath: Map<string, AgentNode>;
  skillByPath: Map<string, SkillDefinition>;
  selectedId?: string;
  onSelectAgent: (agent: AgentNode) => void;
  onSelectSkill: (skill: SkillDefinition) => void;
  onSelectMarkdown: (entry: ProjectEntry) => void;
}) {
  const agent = agentByPath.get(node.relativePath);
  const skill = skillByPath.get(node.relativePath);
  const hasGuidance = branchContainsGuidance(node, agentByPath, skillByPath);
  const [isOpen, setIsOpen] = useState(depth === 0 || !showAll && hasGuidance);

  if (!showAll && !hasGuidance) return null;

  if (node.kind === "directory") {
    return (
      <details
        className="repository-directory"
        open={isOpen}
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
        role="treeitem"
        aria-expanded={isOpen}
      >
        <summary style={{ paddingLeft: `${13 + depth * 17}px` }} title={node.relativePath}>
          <ChevronRight className="branch-chevron" size={13} />
          <Folder size={15} fill="currentColor" />
          <span>{node.name}</span>
        </summary>
        <div role="group">
          {node.children.map((child) => (
            <EntryBranch
              key={child.relativePath}
              node={child}
              depth={depth + 1}
              showAll={showAll}
              agentByPath={agentByPath}
              skillByPath={skillByPath}
              selectedId={selectedId}
              onSelectAgent={onSelectAgent}
              onSelectSkill={onSelectSkill}
              onSelectMarkdown={onSelectMarkdown}
            />
          ))}
        </div>
      </details>
    );
  }

  if (agent) {
    return (
      <button
        className={`repository-file instruction-source ${selectedId === agent.id ? "selected" : ""}`}
        style={{ paddingLeft: `${35 + depth * 17}px` }}
        onClick={() => onSelectAgent(agent)}
        title={agent.relativePath}
        role="treeitem"
      >
        <span className={`instruction-glyph ${agent.fileKind === "override" ? "override" : ""}`}>
          <FileKey2 size={14} strokeWidth={1.8} />
        </span>
        <span>{node.name}</span>
        <small>{agent.fileKind === "override" ? "override" : "instructions"}</small>
      </button>
    );
  }

  if (skill) {
    return (
      <button
        className={`repository-file skill-source ${selectedId === skill.id ? "selected" : ""}`}
        style={{ paddingLeft: `${41 + depth * 17}px` }}
        onClick={() => onSelectSkill(skill)}
        title={skill.relativePath}
        role="treeitem"
      >
        <span className="source-glyph skill-glyph"><Sparkles size={14} strokeWidth={1.8} /></span>
        <span>{skill.name}</span>
        <small>skill</small>
        {skill.diagnostics.length > 0 && <span className="warning-dot" title={skill.diagnostics.join("\n")} />}
      </button>
    );
  }

  if (node.relativePath.toLowerCase().endsWith(".md")) {
    const isReadme = node.name.toLowerCase() === "readme.md";
    return (
      <button
        className={`repository-file markdown-source ${isReadme ? "readme-source" : ""} ${selectedId === node.relativePath ? "selected" : ""}`}
        style={{ paddingLeft: `${41 + depth * 17}px` }}
        onClick={() => onSelectMarkdown(node)}
        title={node.relativePath}
        role="treeitem"
      >
        <span className={`source-glyph ${isReadme ? "readme-glyph" : "markdown-glyph"}`}>
          {isReadme ? <BookOpen size={14} strokeWidth={1.8} /> : <FileText size={14} strokeWidth={1.8} />}
        </span>
        <span>{node.name}</span>
        <small>{isReadme ? "readme" : "markdown"}</small>
      </button>
    );
  }

  if (!showAll) return null;
  return (
    <div className="repository-file ordinary-file" style={{ paddingLeft: `${41 + depth * 17}px` }} title={node.relativePath} role="treeitem">
      <File size={13} />
      <span>{node.name}</span>
    </div>
  );
}

export function AgentExplorer({
  entries,
  agents,
  skills,
  selectedId,
  onSelectAgent,
  onSelectSkill,
  onSelectMarkdown,
  onSelectOverview,
}: Props) {
  const [showAll, setShowAll] = useState(true);
  const tree = useMemo(() => buildTree(entries), [entries]);
  const agentByPath = useMemo(() => new Map(agents.map((agent) => [agent.relativePath, agent])), [agents]);
  const skillByPath = useMemo(() => new Map(skills.map((skill) => [skill.relativePath, skill])), [skills]);

  return (
    <>
      <div className="tree-mode" role="group" aria-label="Repository view">
        <button className={showAll ? "active" : ""} onClick={() => setShowAll(true)}>All files</button>
        <button className={!showAll ? "active" : ""} onClick={() => setShowAll(false)}>Guidance</button>
      </div>
      <button className={`project-overview-row ${selectedId === undefined ? "selected" : ""}`} onClick={onSelectOverview}>
        <Network size={15} />
        <span>Project overview</span>
      </button>
      <div key={showAll ? "all" : "guidance"} className="tree repository-tree" role="tree" aria-label="Repository files and guidance">
        {tree.map((node) => (
          <EntryBranch
            key={node.relativePath}
            node={node}
            depth={0}
            showAll={showAll}
            agentByPath={agentByPath}
            skillByPath={skillByPath}
            selectedId={selectedId}
            onSelectAgent={onSelectAgent}
            onSelectSkill={onSelectSkill}
            onSelectMarkdown={onSelectMarkdown}
          />
        ))}
      </div>
    </>
  );
}
