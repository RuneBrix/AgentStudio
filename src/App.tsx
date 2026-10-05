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
import { AlertTriangle, FileKey2, FileText, FolderOpen, Network, PanelLeftClose, PanelLeftOpen, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { scanProject } from "./api";
import { AgentExplorer } from "./components/AgentExplorer";
import { InstructionDocument } from "./components/InstructionDocument";
import { ProjectSidebar, type SavedProject } from "./components/ProjectSidebar";
import { UpdateNotice } from "./components/UpdateNotice";
import type { AgentNode, ProjectScan, SkillDefinition } from "./model";

const PROJECTS_KEY = "agent-studio.projects.v1";
const ACTIVE_PROJECT_KEY = "agent-studio.active-project.v1";
const SIDEBAR_KEY = "agent-studio.project-sidebar-open.v1";
const STRUCTURE_WIDTH_KEY = "agent-studio.structure-pane-width.v1";
const STRUCTURE_MIN_WIDTH = 240;
const STRUCTURE_MAX_WIDTH = 640;
const STRUCTURE_DEFAULT_WIDTH = 340;
const OVERVIEW_ID = "__project-overview__";

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

function allSkills(agents: AgentNode[]): SkillDefinition[] {
  return agents.flatMap((agent) => [...agent.skills, ...allSkills(agent.children)]);
}

function skillOwner(agents: AgentNode[], skillId: string): AgentNode | undefined {
  for (const agent of agents) {
    if (agent.skills.some((skill) => skill.id === skillId)) return agent;
    const owner = skillOwner(agent.children, skillId);
    if (owner) return owner;
  }
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
  const skills = useMemo(() => (scan ? [...allSkills(scan.agents), ...scan.unscopedSkills] : []), [scan]);
  const selectedId = activeRoot ? selectedIds[activeRoot] : undefined;
  const selectedAgent = agents.find((agent) => agent.id === selectedId);
  const selectedSkill = skills.find((skill) => skill.id === selectedId);
  const selectedMarkdown = !selectedAgent && !selectedSkill
    ? scan?.projectEntries.find((entry) => entry.kind === "file" && entry.relativePath === selectedId && entry.relativePath.toLowerCase().endsWith(".md"))
    : undefined;
  const selectedSkillOwner = selectedSkill && scan ? skillOwner(scan.agents, selectedSkill.id) : undefined;
  const parent = selectedAgent?.parentId ? agents.find((agent) => agent.id === selectedAgent.parentId) : undefined;

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
      setSelectedIds((current) => ({ ...current, [result.root]: current[result.root] ?? first?.id ?? OVERVIEW_ID }));
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
                    <span>Repository</span>
                  </div>
                  <span>{scan.projectEntries.length} entries</span>
                </div>
                {scan.projectEntries.length ? (
                  <AgentExplorer
                    entries={scan.projectEntries}
                    agents={agents}
                    skills={skills}
                    selectedId={selectedAgent?.id ?? selectedSkill?.id ?? selectedMarkdown?.relativePath}
                    onSelectAgent={(agent) => activeRoot && setSelectedIds((current) => ({ ...current, [activeRoot]: agent.id }))}
                    onSelectSkill={(skill) => activeRoot && setSelectedIds((current) => ({ ...current, [activeRoot]: skill.id }))}
                    onSelectMarkdown={(entry) => activeRoot && setSelectedIds((current) => ({ ...current, [activeRoot]: entry.relativePath }))}
                    onSelectOverview={() => activeRoot && setSelectedIds((current) => ({ ...current, [activeRoot]: OVERVIEW_ID }))}
                  />
                ) : (
                  <div className="empty-panel">No files were found in this project.</div>
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
                {selectedAgent ? (
                  <>
                    <div className="detail-heading">
                      <div>
                        <h2>{selectedAgent.name}</h2>
                      </div>
                      <span className={`file-kind ${selectedAgent.fileKind}`}>{selectedAgent.fileKind === "override" ? "Override" : "AGENTS.md"}</span>
                    </div>

                    <dl className="relationship-grid">
                      <div><dt>Applies to</dt><dd><code>{selectedAgent.scope}</code></dd></div>
                      <div><dt>Inherited from</dt><dd>{parent ? parent.name : "Project root"}</dd></div>
                      <div><dt>Child scopes</dt><dd>{selectedAgent.children.length}</dd></div>
                      <div><dt>Skills in scope</dt><dd>{selectedAgent.skills.length}</dd></div>
                    </dl>

                    {selectedAgent.relationship && (
                      <div className="relationship-note">
                        <span>Inferred relationship</span>{selectedAgent.relationship.reason}
                      </div>
                    )}

                    <InstructionDocument key={selectedAgent.id} content={selectedAgent.rawContent} label="Instruction content" />
                  </>
                ) : selectedSkill ? (
                  <>
                    <div className="detail-heading">
                      <div>
                        <h2>{selectedSkill.name}</h2>
                        <p>{selectedSkill.description ?? "This skill does not provide a description."}</p>
                      </div>
                      <span className="file-kind skill">Skill</span>
                    </div>

                    <dl className="relationship-grid skill-facts">
                      <div><dt>File</dt><dd><code>{selectedSkill.relativePath}</code></dd></div>
                      <div><dt>Directory</dt><dd><code>{selectedSkill.directory || "."}</code></dd></div>
                      <div><dt>Associated scope</dt><dd>{selectedSkillOwner?.name ?? "No containing AGENTS.md"}</dd></div>
                      <div><dt>Metadata fields</dt><dd>{Object.keys(selectedSkill.frontmatter).length}</dd></div>
                    </dl>

                    {selectedSkill.diagnostics.length > 0 && (
                      <div className="source-diagnostics" role="status">
                        <AlertTriangle size={16} />
                        <div><strong>Skill diagnostics</strong>{selectedSkill.diagnostics.map((diagnostic) => <span key={diagnostic}>{diagnostic}</span>)}</div>
                      </div>
                    )}

                    <InstructionDocument key={selectedSkill.id} content={selectedSkill.rawContent} label="Skill content" />
                  </>
                ) : selectedMarkdown ? (
                  <>
                    <div className="detail-heading">
                      <div><h2>{selectedMarkdown.relativePath.split("/").at(-1)}</h2></div>
                      <span className={`file-kind ${selectedMarkdown.relativePath.split("/").at(-1)?.toLowerCase() === "readme.md" ? "readme" : "markdown"}`}>
                        {selectedMarkdown.relativePath.split("/").at(-1)?.toLowerCase() === "readme.md" ? "README" : "Markdown"}
                      </span>
                    </div>

                    <dl className="relationship-grid markdown-facts">
                      <div><dt>File</dt><dd><code>{selectedMarkdown.relativePath}</code></dd></div>
                      <div><dt>Folder</dt><dd><code>{selectedMarkdown.relativePath.split("/").slice(0, -1).join("/") || "."}</code></dd></div>
                      <div><dt>Format</dt><dd>Markdown</dd></div>
                      <div><dt>Access</dt><dd>Read only</dd></div>
                    </dl>

                    {selectedMarkdown.markdownContent !== undefined ? (
                      <InstructionDocument key={selectedMarkdown.relativePath} content={selectedMarkdown.markdownContent} label="Markdown content" />
                    ) : (
                      <div className="source-diagnostics" role="status">
                        <AlertTriangle size={16} />
                        <div><strong>Unable to read this Markdown file</strong><span>{scan.diagnostics.find((diagnostic) => diagnostic.path === selectedMarkdown.relativePath)?.message ?? "The file did not provide readable text."}</span></div>
                      </div>
                    )}
                  </>
                ) : (
                  <section className="project-overview">
                    <div className="overview-heading">
                      <div className="overview-mark"><Network size={22} /></div>
                      <div><h2>{scan.projectName}</h2><p>Repository context with instruction sources and skills highlighted.</p></div>
                    </div>
                    <p className="overview-explanation">AgentStudio shows every discovered file and folder for orientation. Markdown files are readable; other file types remain context only.</p>
                    <dl className="overview-facts">
                      <div><dt>Folders</dt><dd>{scan.projectEntries.filter((entry) => entry.kind === "directory").length}</dd></div>
                      <div><dt>Files</dt><dd>{scan.projectEntries.filter((entry) => entry.kind === "file").length}</dd></div>
                      <div><dt>Instruction sources</dt><dd>{agents.length}</dd></div>
                      <div><dt>Skills</dt><dd>{skills.length}</dd></div>
                    </dl>
                    <div className="overview-guidance">
                      <div><FileKey2 size={18} /><span><strong>AGENTS files</strong> define directory-scoped project guidance.</span></div>
                      <div><Sparkles size={18} /><span><strong>Skills</strong> are separate reusable instruction packages and can be opened directly.</span></div>
                      <div><FileText size={18} /><span><strong>Other Markdown</strong> provides project context without being treated as agent guidance.</span></div>
                    </div>
                  </section>
                )}
              </article>
            </div>
        )}
      </section>
    </main>
  );
}
