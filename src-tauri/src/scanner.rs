use serde::Serialize;
use serde_yaml::{Mapping, Value};
use std::{
    collections::HashMap,
    fs, io,
    path::{Path, PathBuf},
};
use walkdir::{DirEntry, WalkDir};

const AGENT_FILE: &str = "AGENTS.md";
const OVERRIDE_FILE: &str = "AGENTS.override.md";
const SKILL_FILE: &str = "SKILL.md";

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Evidence {
    kind: EvidenceKind,
    reason: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum EvidenceKind {
    Inferred,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillDefinition {
    id: String,
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    relative_path: String,
    directory: String,
    raw_content: String,
    frontmatter: serde_json::Map<String, serde_json::Value>,
    diagnostics: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentNode {
    id: String,
    name: String,
    relative_path: String,
    scope: String,
    summary: String,
    raw_content: String,
    file_kind: AgentFileKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    relationship: Option<Evidence>,
    skills: Vec<SkillDefinition>,
    children: Vec<AgentNode>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
enum AgentFileKind {
    Agents,
    Override,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanDiagnostic {
    path: String,
    severity: DiagnosticSeverity,
    message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
enum DiagnosticSeverity {
    Warning,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectScan {
    root: String,
    project_name: String,
    agents: Vec<AgentNode>,
    unscoped_skills: Vec<SkillDefinition>,
    diagnostics: Vec<ScanDiagnostic>,
    scanned_files: usize,
}

#[derive(Debug)]
struct FlatAgent {
    node: AgentNode,
    directory: PathBuf,
}

pub fn scan_project(root: &Path) -> io::Result<ProjectScan> {
    let root = root.canonicalize()?;
    if !root.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "selected path is not a directory",
        ));
    }

    let mut agents = Vec::new();
    let mut skills = Vec::new();
    let mut diagnostics = Vec::new();

    let walker = WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_entry(should_visit);

    for entry in walker {
        let entry = match entry {
            Ok(entry) => entry,
            Err(error) => {
                diagnostics.push(ScanDiagnostic {
                    path: error
                        .path()
                        .map(|path| relative_display(&root, path))
                        .unwrap_or_default(),
                    severity: DiagnosticSeverity::Warning,
                    message: error.to_string(),
                });
                continue;
            }
        };
        if !entry.file_type().is_file() {
            continue;
        }

        let file_name = entry.file_name().to_string_lossy();
        if file_name == AGENT_FILE || file_name == OVERRIDE_FILE {
            match parse_agent(&root, entry.path(), file_name == OVERRIDE_FILE) {
                Ok(agent) => agents.push(agent),
                Err(error) => diagnostics.push(read_diagnostic(&root, entry.path(), error)),
            }
        } else if file_name.eq_ignore_ascii_case(SKILL_FILE) {
            match parse_skill(&root, entry.path()) {
                Ok(skill) => skills.push(skill),
                Err(error) => diagnostics.push(read_diagnostic(&root, entry.path(), error)),
            }
        }
    }

    agents.sort_by(|left, right| {
        left.directory
            .components()
            .count()
            .cmp(&right.directory.components().count())
            .then(left.node.relative_path.cmp(&right.node.relative_path))
    });
    skills.sort_by(|left, right| left.relative_path.cmp(&right.relative_path));

    let scanned_files = agents.len() + skills.len();
    let (agent_tree, unscoped_skills) = build_tree(agents, skills);
    let project_name = root
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| root.display().to_string());

    Ok(ProjectScan {
        root: root.display().to_string(),
        project_name,
        agents: agent_tree,
        unscoped_skills,
        diagnostics,
        scanned_files,
    })
}

fn should_visit(entry: &DirEntry) -> bool {
    if entry.depth() == 0 || !entry.file_type().is_dir() {
        return true;
    }
    !matches!(
        entry.file_name().to_string_lossy().as_ref(),
        ".git" | "node_modules" | "target" | ".next" | "dist"
    )
}

fn parse_agent(root: &Path, path: &Path, is_override: bool) -> io::Result<FlatAgent> {
    let raw_content = fs::read_to_string(path)?;
    let directory = path.parent().unwrap_or(root).to_path_buf();
    let scope = relative_display(root, &directory);
    let display_scope = if scope.is_empty() {
        ".".to_string()
    } else {
        scope.clone()
    };
    let relative_path = relative_display(root, path);
    let name = if scope.is_empty() {
        "Project instructions".to_string()
    } else {
        directory
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned()
    };

    Ok(FlatAgent {
        directory,
        node: AgentNode {
            id: relative_path.clone(),
            name,
            relative_path,
            scope: display_scope,
            summary: summarize_markdown(&raw_content),
            raw_content,
            file_kind: if is_override {
                AgentFileKind::Override
            } else {
                AgentFileKind::Agents
            },
            parent_id: None,
            relationship: None,
            skills: Vec::new(),
            children: Vec::new(),
        },
    })
}

fn parse_skill(root: &Path, path: &Path) -> io::Result<SkillDefinition> {
    let raw_content = fs::read_to_string(path)?;
    let relative_path = relative_display(root, path);
    let directory_path = path.parent().unwrap_or(root);
    let directory = relative_display(root, directory_path);
    let (frontmatter, mut diagnostics) = parse_frontmatter(&raw_content);
    let name = frontmatter
        .get("name")
        .and_then(serde_json::Value::as_str)
        .map(str::to_owned)
        .unwrap_or_else(|| {
            diagnostics.push(
                "Missing string `name` in YAML front matter; using directory name.".to_string(),
            );
            directory_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned()
        });
    let description = frontmatter
        .get("description")
        .and_then(serde_json::Value::as_str)
        .map(str::to_owned);
    if description.is_none() {
        diagnostics.push("Missing string `description` in YAML front matter.".to_string());
    }

    Ok(SkillDefinition {
        id: relative_path.clone(),
        name,
        description,
        relative_path,
        directory,
        raw_content,
        frontmatter,
        diagnostics,
    })
}

fn parse_frontmatter(content: &str) -> (serde_json::Map<String, serde_json::Value>, Vec<String>) {
    let mut diagnostics = Vec::new();
    let normalized = content.strip_prefix('\u{feff}').unwrap_or(content);
    let mut lines = normalized.lines();
    if lines.next().map(str::trim) != Some("---") {
        diagnostics.push("SKILL.md must start with YAML front matter.".to_string());
        return (serde_json::Map::new(), diagnostics);
    }
    let mut yaml_lines = Vec::new();
    let mut closed = false;
    for line in lines {
        if line.trim() == "---" {
            closed = true;
            break;
        }
        yaml_lines.push(line);
    }
    if !closed {
        diagnostics.push("YAML front matter is not closed.".to_string());
        return (serde_json::Map::new(), diagnostics);
    }

    match serde_yaml::from_str::<Mapping>(&yaml_lines.join("\n")) {
        Ok(mapping) => {
            let value = serde_json::to_value(Value::Mapping(mapping)).unwrap_or_default();
            match value {
                serde_json::Value::Object(object) => (object, diagnostics),
                _ => {
                    diagnostics.push("YAML front matter must be a mapping.".to_string());
                    (serde_json::Map::new(), diagnostics)
                }
            }
        }
        Err(error) => {
            diagnostics.push(format!("Invalid YAML front matter: {error}"));
            (serde_json::Map::new(), diagnostics)
        }
    }
}

fn build_tree(
    mut agents: Vec<FlatAgent>,
    skills: Vec<SkillDefinition>,
) -> (Vec<AgentNode>, Vec<SkillDefinition>) {
    let mut parent_by_id: HashMap<String, Option<String>> = HashMap::new();
    for index in 0..agents.len() {
        let parent = (0..index)
            .rev()
            .find(|candidate| {
                agents[index]
                    .directory
                    .starts_with(&agents[*candidate].directory)
                    && agents[index].directory != agents[*candidate].directory
            })
            .map(|candidate| agents[candidate].node.id.clone());
        parent_by_id.insert(agents[index].node.id.clone(), parent);
    }

    let agent_scopes: Vec<(String, PathBuf)> = agents
        .iter()
        .map(|agent| {
            let scope = if agent.node.scope == "." {
                PathBuf::new()
            } else {
                PathBuf::from(&agent.node.scope)
            };
            (agent.node.id.clone(), scope)
        })
        .collect();
    let mut unscoped_skills = Vec::new();
    for skill in skills {
        let skill_dir = PathBuf::from(&skill.directory);
        let owner = agent_scopes
            .iter()
            .filter(|(_, scope)| skill_dir.starts_with(scope))
            .max_by_key(|(_, scope)| scope.components().count())
            .map(|(id, _)| id.clone());

        if let Some(owner_id) = owner {
            if let Some(agent) = agents.iter_mut().find(|agent| agent.node.id == owner_id) {
                agent.node.skills.push(skill);
            }
        } else {
            unscoped_skills.push(skill);
        }
    }

    let mut nodes: HashMap<String, AgentNode> = agents
        .into_iter()
        .map(|flat| (flat.node.id.clone(), flat.node))
        .collect();
    let ordered_ids: Vec<String> = nodes.keys().cloned().collect();
    for id in &ordered_ids {
        if let Some(Some(parent_id)) = parent_by_id.get(id) {
            if let Some(node) = nodes.get_mut(id) {
                node.parent_id = Some(parent_id.clone());
                node.relationship = Some(Evidence {
                    kind: EvidenceKind::Inferred,
                    reason: "Nearest ancestor AGENTS.md by filesystem scope".to_string(),
                });
            }
        }
    }

    fn assemble(
        id: &str,
        nodes: &HashMap<String, AgentNode>,
        parents: &HashMap<String, Option<String>>,
    ) -> AgentNode {
        let mut node = nodes.get(id).expect("known node").clone();
        let mut child_ids: Vec<&String> = parents
            .iter()
            .filter_map(|(child_id, parent)| (parent.as_deref() == Some(id)).then_some(child_id))
            .collect();
        child_ids.sort();
        node.children = child_ids
            .into_iter()
            .map(|child_id| assemble(child_id, nodes, parents))
            .collect();
        node
    }

    let mut root_ids: Vec<&String> = parent_by_id
        .iter()
        .filter_map(|(id, parent)| parent.is_none().then_some(id))
        .collect();
    root_ids.sort();
    (
        root_ids
            .into_iter()
            .map(|id| assemble(id, &nodes, &parent_by_id))
            .collect(),
        unscoped_skills,
    )
}

fn summarize_markdown(content: &str) -> String {
    let mut paragraph = Vec::new();
    let mut in_fence = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence || trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with("<!--")
        {
            if !paragraph.is_empty() {
                break;
            }
            continue;
        }
        let clean = trimmed
            .trim_start_matches(|character: char| matches!(character, '-' | '*' | '>' | ' '));
        if !clean.is_empty() {
            paragraph.push(clean);
        }
        if paragraph.join(" ").chars().count() >= 180 {
            break;
        }
    }
    let summary = paragraph.join(" ");
    if summary.is_empty() {
        "No prose summary could be inferred from this file.".to_string()
    } else if summary.chars().count() > 220 {
        format!("{}…", summary.chars().take(219).collect::<String>())
    } else {
        summary
    }
}

fn relative_display(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

fn read_diagnostic(root: &Path, path: &Path, error: io::Error) -> ScanDiagnostic {
    ScanDiagnostic {
        path: relative_display(root, path),
        severity: DiagnosticSeverity::Warning,
        message: error.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{create_dir_all, write};
    use tempfile::tempdir;

    #[test]
    fn discovers_agents_skills_and_builds_scope_hierarchy() {
        let temp = tempdir().unwrap();
        create_dir_all(temp.path().join("apps/web/.codex/skills/review")).unwrap();
        write(
            temp.path().join("AGENTS.md"),
            "# Project\n\nShared project guidance.",
        )
        .unwrap();
        write(
            temp.path().join("apps/web/AGENTS.md"),
            "# Web\n\nOwns the web interface.",
        )
        .unwrap();
        write(
            temp.path().join("apps/web/.codex/skills/review/SKILL.md"),
            "---\nname: review-ui\ndescription: Review UI changes.\n---\n\nCheck accessibility.",
        )
        .unwrap();

        let scan = scan_project(temp.path()).unwrap();

        assert_eq!(scan.scanned_files, 3);
        assert_eq!(scan.agents.len(), 1);
        assert_eq!(scan.agents[0].children.len(), 1);
        let web = &scan.agents[0].children[0];
        assert_eq!(web.scope, "apps/web");
        assert_eq!(web.skills.len(), 1);
        assert_eq!(web.skills[0].name, "review-ui");
        assert_eq!(
            web.relationship.as_ref().unwrap().kind,
            EvidenceKind::Inferred
        );
    }

    #[test]
    fn keeps_unknown_skill_frontmatter_and_reports_missing_required_fields() {
        let temp = tempdir().unwrap();
        create_dir_all(temp.path().join("skills/example")).unwrap();
        write(
            temp.path().join("skills/example/skill.md"),
            "---\ncustom: true\n---\n\nInstructions",
        )
        .unwrap();

        let scan = scan_project(temp.path()).unwrap();
        let skill = &scan.unscoped_skills[0];

        assert_eq!(skill.name, "example");
        assert_eq!(
            skill.frontmatter.get("custom"),
            Some(&serde_json::Value::Bool(true))
        );
        assert_eq!(skill.diagnostics.len(), 2);
    }

    #[test]
    fn ignores_generated_and_dependency_directories() {
        let temp = tempdir().unwrap();
        create_dir_all(temp.path().join("node_modules/pkg")).unwrap();
        create_dir_all(temp.path().join("target/output")).unwrap();
        write(temp.path().join("node_modules/pkg/AGENTS.md"), "ignored").unwrap();
        write(temp.path().join("target/output/AGENTS.md"), "ignored").unwrap();

        let scan = scan_project(temp.path()).unwrap();

        assert_eq!(scan.scanned_files, 0);
    }

    #[test]
    fn summarizes_first_prose_paragraph_without_mutating_source() {
        let content = "# Backend agent\n\nKeeps API behavior stable.\nStill part of the summary.\n\n## Rules\nMore text.";
        assert_eq!(
            summarize_markdown(content),
            "Keeps API behavior stable. Still part of the summary."
        );
    }
}
