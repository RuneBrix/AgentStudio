import { invoke } from "@tauri-apps/api/core";
import type { ProjectScan } from "./model";

export function scanProject(root: string): Promise<ProjectScan> {
  return invoke<ProjectScan>("scan_project", { root });
}
