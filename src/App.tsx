import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { AlertTriangle, FolderOpen, Network, PanelLeftClose, PanelLeftOpen, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { scanProject } from "./api";
import { AgentExplorer } from "./components/AgentExplorer";
import { InstructionDocument } from "./components/InstructionDocument";
import { ProjectSidebar, type SavedProject } from "./components/ProjectSidebar";
import { UpdateNotice } from "./components/UpdateNotice";
import type { AgentNode, ProjectScan } from "./model";

const PROJECTS_KEY = "agent-studio.projects.v1";
const ACTIVE_PROJECT_KEY = "agent-studio.active-project.v1";
const SIDEBAR_KEY = "agent-studio.project-sidebar-open.v1";
const STRUCTURE_WIDTH_KEY = "agent-studio.structure-pane-width.v1";
const STRUCTURE_MIN_WIDTH = 240;
const STRUCTURE_MAX_WIDTH = 640;
const STRUCTURE_DEFAULT_WIDTH = 340;

function loadStructureWidth(): number {
  const stored = localStorage.getItem(STRUCTURE_WIDTH_KEY);
  if (stored === null) return STRUCTURE_DEFAULT_WIDTH;
  const saved = Number(stored);
  return Number.isFinite(saved)
    ? Math.min(STRUCTURE_MAX_WIDTH, Math.max(STRUCTURE_MIN_WIDTH, saved))
    : STRUCTURE_DEFAULT_WIDTH;
}

function allAgents(agents: AgentNode[]): AgentNode[] {
  return agents.flatMap((agent) => [agent, ...allAgents(agent.children)]);
}

function loadProjects(): SavedProject[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((project): project is SavedProject =>
      typeof project === "object" && project !== null &&
      typeof (project as SavedProject).name === "string" &&
      typeof (project as SavedProject).root === "string"
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [projects, setProjects] = useState<SavedProject[]>(loadProjects);
  const [activeRoot, setActiveRoot] = useState<string | undefined>(() => localStorage.getItem(ACTIVE_PROJECT_KEY) ?? undefined);
  const [scans, setScans] = useState<Record<string, ProjectScan>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, string | undefined>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== "false");
  const [structureWidth, setStructureWidth] = useState(loadStructureWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>();
  const workspaceRef = useRef<HTMLElement>(null);
  const resizeRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  const scan = activeRoot ? scans[activeRoot] : undefined;
  const agents = useMemo(() => (scan ? allAgents(scan.agents) : []), [scan]);
  const selected = agents.find((agent) => agent.id === (activeRoot ? selectedIds[activeRoot] : undefined)) ?? agents[0];
  const parent = selected?.parentId ? agents.find((agent) => agent.id === selected.parentId) : undefined;

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeRoot) localStorage.setItem(ACTIVE_PROJECT_KEY, activeRoot);
    else localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }, [activeRoot]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(STRUCTURE_WIDTH_KEY, String(Math.round(structureWidth)));
  }, [structureWidth]);

  useEffect(() => {
    function fitPanesToWindow() {
      setStructureWidth((current) => constrainStructureWidth(current));
    }
    window.addEventListener("resize", fitPanesToWindow);
    fitPanesToWindow();
    return () => window.removeEventListener("resize", fitPanesToWindow);
  }, [isSidebarOpen]);

  useEffect(() => {
    const initialRoot = projects.some((project) => project.root === activeRoot) ? activeRoot : projects[0]?.root;
    if (!initialRoot) return;
    if (initialRoot !== activeRoot) setActiveRoot(initialRoot);
    if (!scans[initialRoot] && !isScanning) void loadProject(initialRoot);
    // This effect restores saved projects; loadProject owns the scan result state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, activeRoot]);

  async function loadProject(root: string) {
    setIsScanning(true);
    setError(undefined);
    try {
      const result = await scanProject(root);
      setScans((current) => ({ ...current, [root]: result, [result.root]: result }));
      setProjects((current) => {
        const saved = { root: result.root, name: result.projectName };
        return [saved, ...current.filter((project) => project.root !== root && project.root !== result.root)];
      });
      setActiveRoot(result.root);
      const first = allAgents(result.agents)[0];
      setSelectedIds((current) => ({ ...current, [result.root]: current[result.root] ?? first?.id }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsScanning(false);
    }
  }

  async function chooseFolder() {
    const folder = await open({ directory: true, multiple: false, title: "Add a software project" });
    if (folder) await loadProject(folder);
  }

  function removeProject(root: string) {
    const remaining = projects.filter((project) => project.root !== root);
    setProjects(remaining);
    setScans((current) => {
      const next = { ...current };
      delete next[root];
      return next;
    });
    if (activeRoot === root) setActiveRoot(remaining[0]?.root);
  }

  function selectProject(root: string) {
    setActiveRoot(root);
    if (!scans[root]) void loadProject(root);
  }

  function constrainStructureWidth(width: number): number {
    const availableWidth = workspaceRef.current?.clientWidth ?? window.innerWidth;
    const responsiveMaximum = Math.max(STRUCTURE_MIN_WIDTH, availableWidth - 360);
    return Math.min(STRUCTURE_MAX_WIDTH, responsiveMaximum, Math.max(STRUCTURE_MIN_WIDTH, width));
  }

  function startPaneResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: structureWidth };
    setIsResizing(true);
  }

  function movePaneResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    setStructureWidth(constrainStructureWidth(resize.startWidth + event.clientX - resize.startX));
  }

  function finishPaneResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (resizeRef.current?.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    setIsResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resizePaneWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const increments: Record<string, number> = { ArrowLeft: -24, ArrowRight: 24 };
    if (event.key in increments) {
      event.preventDefault();
      setStructureWidth((current) => constrainStructureWidth(current + increments[event.key]));
    } else if (event.key === "Home") {
      event.preventDefault();
      setStructureWidth(STRUCTURE_MIN_WIDTH);
    } else if (event.key === "End") {
      event.preventDefault();
      setStructureWidth(constrainStructureWidth(STRUCTURE_MAX_WIDTH));
    }
  }

  if (projects.length === 0) {
    return (
      <main className="welcome-shell">
        <UpdateNotice />
        <div className="brand-mark"><Network size={29} /></div>
        <p className="eyebrow">AgentStudio</p>
        <h1>Understand the instructions<br />behind your project.</h1>
        <p className="lede">Map filesystem scope, inherited guidance, and project skills in a readable local workspace.</p>
        <button className="primary-button" onClick={chooseFolder} disabled={isScanning}>
          {isScanning ? <ScanLine className="spin" size={18} /> : <FolderOpen size={18} />}
          {isScanning ? "Scanning project…" : "Add your first project"}
        </button>
        {error && <div className="error-message"><AlertTriangle size={16} />{error}</div>}
        <div className="trust-note"><ShieldCheck size={15} /> Projects stay local and read only</div>
      </main>
    );
  }

  return (
    <main className={`app-layout ${isSidebarOpen ? "" : "sidebar-collapsed"} ${isResizing ? "is-resizing" : ""}`}>
      <UpdateNotice />
      <ProjectSidebar
        projects={projects}
        activeRoot={activeRoot}
        activeScan={scan}
        isScanning={isScanning}
        onAdd={chooseFolder}
        onRefresh={() => activeRoot && loadProject(activeRoot)}
        onRemove={removeProject}
        onSelect={selectProject}
      />

      <section className="workspace" ref={workspaceRef}>
        {error && <div className="workspace-error"><AlertTriangle size={16} />{error}</div>}
        {!scan ? (
          <div className="loading-workspace"><ScanLine className="spin" size={24} /><span>Scanning project…</span></div>
        ) : (
          <div
            className="explorer-layout"
            style={{ "--structure-pane-width": `${structureWidth}px` } as CSSProperties}
          >
              <aside className="scope-panel" aria-label="Project structure">
                <div className="panel-heading">
                  <div className="panel-heading-primary">
                    <button
                      className="workspace-sidebar-toggle"
                      onClick={() => setIsSidebarOpen((current) => !current)}
                      aria-label={isSidebarOpen ? "Hide project sidebar" : "Show project sidebar"}
                      title={isSidebarOpen ? "Hide project sidebar" : "Show project sidebar"}
                    >
                      {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
                    </button>
                    <span>Project structure</span>
                  </div>
                  <span>{agents.length} scopes</span>
                </div>
                {scan.agents.length ? (
                  <AgentExplorer
                    agents={scan.agents}
                    selectedId={selected?.id}
                    onSelect={(agent) => activeRoot && setSelectedIds((current) => ({ ...current, [activeRoot]: agent.id }))}
                  />
                ) : (
                  <div className="empty-panel">No AGENTS.md files were found in this project.</div>
                )}
                {scan.unscopedSkills.length > 0 && (
                  <div className="unscoped-skills">
                    <p>Unscoped project skills</p>
                    {scan.unscopedSkills.map((skill) => <div className="skill-row" key={skill.id}><Sparkles size={13} />{skill.name}</div>)}
                  </div>
                )}
              </aside>

              <div
                className="pane-resizer"
                role="separator"
                aria-label="Resize project structure"
                aria-orientation="vertical"
                aria-valuemin={STRUCTURE_MIN_WIDTH}
                aria-valuemax={STRUCTURE_MAX_WIDTH}
                aria-valuenow={Math.round(structureWidth)}
                tabIndex={0}
                onDoubleClick={() => setStructureWidth(constrainStructureWidth(STRUCTURE_DEFAULT_WIDTH))}
                onKeyDown={resizePaneWithKeyboard}
                onPointerDown={startPaneResize}
                onPointerMove={movePaneResize}
                onPointerUp={finishPaneResize}
                onPointerCancel={finishPaneResize}
                onLostPointerCapture={() => {
                  resizeRef.current = null;
                  setIsResizing(false);
                }}
              >
                <span />
              </div>

              <article className="detail-panel">
                {selected ? (
                  <>
                    <div className="detail-heading">
                      <div>
                        <div className="detail-kicker">{selected.fileKind === "override" ? "Override instructions" : "Scoped instructions"}</div>
                        <h2>{selected.name}</h2>
                        <p>{selected.summary}</p>
                      </div>
                      <span className={`file-kind ${selected.fileKind}`}>{selected.fileKind === "override" ? "Override" : "AGENTS.md"}</span>
                    </div>

                    <dl className="relationship-grid">
                      <div><dt>Applies to</dt><dd><code>{selected.scope}</code></dd></div>
                      <div><dt>Inherited from</dt><dd>{parent ? parent.name : "Project root"}</dd></div>
                      <div><dt>Child scopes</dt><dd>{selected.children.length}</dd></div>
                      <div><dt>Skills in scope</dt><dd>{selected.skills.length}</dd></div>
                    </dl>

                    {selected.relationship && (
                      <div className="relationship-note">
                        <span>Inferred relationship</span>{selected.relationship.reason}
                      </div>
                    )}

                    <InstructionDocument key={selected.id} content={selected.rawContent} />
                  </>
                ) : (
                  <div className="empty-detail"><ScanLine size={28} /><h2>No instruction source selected</h2><p>Choose one from the project structure.</p></div>
                )}
              </article>
            </div>
        )}
      </section>
    </main>
  );
}
