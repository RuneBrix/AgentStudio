import { ChevronRight, FileKey2, Folder, Sparkles } from "lucide-react";
import type { AgentNode, SkillDefinition } from "../model";

interface Props {
  agents: AgentNode[];
  selectedId?: string;
  onSelect: (agent: AgentNode) => void;
}

function scopeLabel(agent: AgentNode): string {
  if (agent.scope === ".") return "Project root";
  return agent.scope.split("/").at(-1) ?? agent.scope;
}

function SkillRow({ skill }: { skill: SkillDefinition }) {
  return (
    <div className="skill-row" title={skill.relativePath}>
      <Sparkles size={13} strokeWidth={1.8} />
      <span>{skill.name}</span>
      {skill.diagnostics.length > 0 && <span className="warning-dot" title={skill.diagnostics.join("\n")} />}
    </div>
  );
}

function ScopeBranch({ agent, depth, selectedId, onSelect }: Omit<Props, "agents"> & { agent: AgentNode; depth: number }) {
  return (
    <div className="scope-branch" role="treeitem" aria-expanded="true">
      <div className="scope-row" style={{ paddingLeft: `${14 + depth * 18}px` }}>
        <ChevronRight className="branch-chevron" size={13} />
        <Folder size={15} fill="currentColor" />
        <span>{scopeLabel(agent)}</span>
        <code>{agent.scope}</code>
      </div>
      <button
        className={`instruction-row ${selectedId === agent.id ? "selected" : ""}`}
        style={{ paddingLeft: `${43 + depth * 18}px` }}
        onClick={() => onSelect(agent)}
      >
        <span className={`instruction-glyph ${agent.fileKind === "override" ? "override" : ""}`}>
          <FileKey2 size={14} strokeWidth={1.8} />
        </span>
        <span className="instruction-copy">
          <strong>{agent.relativePath.split("/").at(-1)}</strong>
          <span>{agent.summary}</span>
        </span>
        {agent.relationship && <span className="inferred-badge">inferred</span>}
      </button>
      {agent.skills.length > 0 && (
        <div className="scope-skills" style={{ paddingLeft: `${65 + depth * 18}px` }}>
          {agent.skills.map((skill) => <SkillRow key={skill.id} skill={skill} />)}
        </div>
      )}
      {agent.children.map((child) => (
        <ScopeBranch key={child.id} agent={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function AgentExplorer({ agents, selectedId, onSelect }: Props) {
  return (
    <div className="tree" role="tree" aria-label="Project instruction scopes">
      {agents.map((agent) => (
        <ScopeBranch key={agent.id} agent={agent} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
