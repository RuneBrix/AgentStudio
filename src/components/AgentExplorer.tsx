import { ChevronRight, FileText, Sparkles } from "lucide-react";
import type { AgentNode, SkillDefinition } from "../model";

interface Props {
  agents: AgentNode[];
  selectedId?: string;
  onSelect: (agent: AgentNode) => void;
}

function SkillRow({ skill }: { skill: SkillDefinition }) {
  return (
    <div className="skill-row" title={skill.relativePath}>
      <Sparkles size={14} strokeWidth={1.8} />
      <span>{skill.name}</span>
      {skill.diagnostics.length > 0 && <span className="warning-dot" title={skill.diagnostics.join("\n")} />}
    </div>
  );
}

function AgentBranch({ agent, depth, selectedId, onSelect }: Props & { agent: AgentNode; depth: number }) {
  return (
    <div className="agent-branch">
      <button
        className={`agent-row ${selectedId === agent.id ? "selected" : ""}`}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
        onClick={() => onSelect(agent)}
      >
        <ChevronRight className="branch-chevron" size={14} />
        <span className={`agent-glyph ${agent.fileKind === "override" ? "override" : ""}`}>
          <FileText size={14} strokeWidth={1.8} />
        </span>
        <span className="agent-label">{agent.name}</span>
        {agent.fileKind === "override" && <span className="mini-badge">override</span>}
      </button>
      {agent.skills.map((skill) => (
        <div key={skill.id} style={{ paddingLeft: `${50 + depth * 20}px` }}>
          <SkillRow skill={skill} />
        </div>
      ))}
      {agent.children.map((child) => (
        <AgentBranch
          key={child.id}
          agent={child}
          depth={depth + 1}
          agents={[]}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function AgentExplorer({ agents, selectedId, onSelect }: Props) {
  return (
    <div className="tree" role="tree" aria-label="Agent hierarchy">
      {agents.map((agent) => (
        <AgentBranch
          key={agent.id}
          agent={agent}
          depth={0}
          agents={agents}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
