import { FolderOpen, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { ProjectScan } from "../model";

export interface SavedProject {
  name: string;
  root: string;
}

interface Props {
  projects: SavedProject[];
  activeRoot?: string;
  activeScan?: ProjectScan;
  isScanning: boolean;
  onAdd: () => void;
  onRefresh: () => void;
  onRemove: (root: string) => void;
  onSelect: (root: string) => void;
}

function projectInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "P";
}

export function ProjectSidebar({
  projects,
  activeRoot,
  activeScan,
  isScanning,
  onAdd,
  onRefresh,
  onRemove,
  onSelect,
}: Props) {
  return (
    <aside className="project-sidebar" aria-label="Projects">
      <div className="sidebar-heading">
        <span>Projects</span>
        <button className="icon-button" onClick={onAdd} aria-label="Add project" title="Add project">
          <Plus size={17} />
        </button>
      </div>

      <nav className="project-list" aria-label="Saved projects">
        {projects.map((project) => {
          const isActive = project.root === activeRoot;
          return (
            <div className={`project-item ${isActive ? "active" : ""}`} key={project.root}>
              <button className="project-select" onClick={() => onSelect(project.root)} aria-current={isActive ? "page" : undefined}>
                <span className="project-avatar" aria-hidden="true">{projectInitial(project.name)}</span>
                <span className="project-copy">
                  <strong>{project.name}</strong>
                  <span>{project.root}</span>
                </span>
              </button>
              <button
                className="project-remove"
                onClick={() => onRemove(project.root)}
                aria-label={`Remove ${project.name}`}
                title="Remove from sidebar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </nav>

      {activeScan && (
        <div className="project-facts">
          <div><span>Instruction files</span><strong>{activeScan.scannedFiles}</strong></div>
          <div><span>Scan notes</span><strong>{activeScan.diagnostics.length}</strong></div>
          <button className="sidebar-action" onClick={onRefresh} disabled={isScanning}>
            <RefreshCw className={isScanning ? "spin" : ""} size={15} />
            {isScanning ? "Scanning…" : "Rescan project"}
          </button>
        </div>
      )}

      <button className="add-project-button" onClick={onAdd}>
        <FolderOpen size={16} /> Add project
      </button>
    </aside>
  );
}
