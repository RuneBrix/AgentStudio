import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { AlertTriangle, FolderOpen, Network, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { scanProject } from "./api";
import { AgentExplorer } from "./components/AgentExplorer";
import type { AgentNode, ProjectScan } from "./model";

function countAgents(agents: AgentNode[]): number {
  return agents.reduce((count, agent) => count + 1 + countAgents(agent.children), 0);
}

function firstAgent(agents: AgentNode[]): AgentNode | undefined {
  return agents[0];
}

export default function App() {
  const [scan, setScan] = useState<ProjectScan>();
  const [selected, setSelected] = useState<AgentNode>();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>();

  const agentCount = useMemo(() => (scan ? countAgents(scan.agents) : 0), [scan]);

  async function chooseFolder() {
    const folder = await open({ directory: true, multiple: false, title: "Choose a software project" });
    if (!folder) return;
    setIsScanning(true);
    setError(undefined);
    try {
      const result = await scanProject(folder);
      setScan(result);
      setSelected(firstAgent(result.agents));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsScanning(false);
    }
  }

  if (!scan) {
    return (
      <main className="welcome-shell">
        <div className="brand-mark"><Network size={29} /></div>
        <p className="eyebrow">AgentStudio</p>
        <h1>See how your project<br />guides its agents.</h1>
        <p className="lede">
          Explore the scope, inheritance, and skills hidden across your repository — without changing a file.
        </p>
        <button className="primary-button" onClick={chooseFolder} disabled={isScanning}>
          {isScanning ? <ScanLine className="spin" size={18} /> : <FolderOpen size={18} />}
          {isScanning ? "Scanning project…" : "Choose project folder"}
        </button>
        {error && <div className="error-message"><AlertTriangle size={16} />{error}</div>}
        <div className="trust-note"><ShieldCheck size={15} /> Read-only until you explicitly choose an action</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="wordmark"><span className="brand-mark small"><Network size={18} /></span>AgentStudio</div>
        <button className="folder-button" onClick={chooseFolder} disabled={isScanning}>
          <FolderOpen size={16} /> {isScanning ? "Scanning…" : "Open project"}
        </button>
      </header>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">Project</p>
          <h1>{scan.projectName}</h1>
          <p className="project-path">{scan.root}</p>
        </div>
        <div className="stats">
          <span><b>{agentCount}</b> agents</span>
          <span><b>{scan.scannedFiles - agentCount}</b> skills</span>
          {scan.diagnostics.length > 0 && <span className="warning-stat"><b>{scan.diagnostics.length}</b> notes</span>}
        </div>
      </section>
      <section className="content-grid">
        <aside className="explorer-panel">
          <div className="panel-title"><span>Explorer</span><span className="inferred-key">dotted = inferred</span></div>
          {scan.agents.length ? (
            <AgentExplorer agents={scan.agents} selectedId={selected?.id} onSelect={setSelected} />
          ) : (
            <div className="empty-panel">No AGENTS.md files found.</div>
          )}
          {scan.unscopedSkills.length > 0 && (
            <div className="unscoped-skills">
              <p>Project skills</p>
              {scan.unscopedSkills.map((skill) => <div className="skill-row" key={skill.id}><Sparkles size={14} />{skill.name}</div>)}
            </div>
          )}
        </aside>
        <article className="detail-panel">
          {selected ? (
            <>
              <div className="detail-kicker">{selected.fileKind === "override" ? "Override instructions" : "Agent instructions"}</div>
              <h2>{selected.name}</h2>
              <p className="detail-summary">{selected.summary}</p>
              <div className="detail-meta">
                <div><span>Scope</span><code>{selected.scope}</code></div>
                <div><span>Source</span><code>{selected.relativePath}</code></div>
                <div><span>Relationship</span><p>{selected.relationship?.reason ?? "Project-level instruction source"}</p></div>
              </div>
              <div className="read-only-banner"><ShieldCheck size={16} /> Source preview · read only</div>
              <pre className="source-preview">{selected.rawContent}</pre>
            </>
          ) : (
            <div className="empty-detail"><ScanLine size={28} /><h2>No agent selected</h2><p>Choose an agent from the explorer.</p></div>
          )}
        </article>
      </section>
    </main>
  );
}
