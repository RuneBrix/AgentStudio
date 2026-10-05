import { useState } from "react";
import { Code2, Eye, ShieldCheck } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  label?: string;
}

export function InstructionDocument({ content, label = "Instruction content" }: Props) {
  const [mode, setMode] = useState<"read" | "source">("read");

  return (
    <section className="instruction-document" aria-label={label}>
      <div className="document-toolbar">
        <div className="view-switch" role="group" aria-label="Content view">
          <button className={mode === "read" ? "active" : ""} onClick={() => setMode("read")}>
            <Eye size={14} /> Read
          </button>
          <button className={mode === "source" ? "active" : ""} onClick={() => setMode("source")}>
            <Code2 size={14} /> Source
          </button>
        </div>
        <span className="read-only-label"><ShieldCheck size={14} /> Read only</span>
      </div>

      {mode === "read" ? (
        <div className="markdown-document">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      ) : (
        <pre className="source-preview">{content}</pre>
      )}
    </section>
  );
}
