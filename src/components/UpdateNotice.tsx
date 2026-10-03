import { useEffect, useState } from "react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

let pendingCheck: Promise<Update | null> | undefined;

function checkOnce() {
  pendingCheck ??= check();
  return pendingCheck;
}

export function UpdateNotice() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<"ready" | "installing" | "failed">("ready");

  useEffect(() => {
    let active = true;
    void checkOnce()
      .then((available) => {
        if (active) setUpdate(available);
      })
      .catch((error) => console.warn("Update check failed", error));
    return () => {
      active = false;
    };
  }, []);

  if (!update) return null;

  async function install() {
    setStatus("installing");
    try {
      await update!.downloadAndInstall();
      await relaunch();
    } catch (error) {
      console.error("Update installation failed", error);
      setStatus("failed");
    }
  }

  return (
    <aside className="update-notice" aria-live="polite">
      <div>
        <strong>AgentStudio {update.version} is available</strong>
        <span>{status === "failed" ? "The update could not be installed. Please try again." : "Download it now and restart the app."}</span>
      </div>
      <div className="update-actions">
        <button onClick={install} disabled={status === "installing"}>
          {status === "installing" ? "Installing…" : "Update and restart"}
        </button>
        <button className="update-later" onClick={() => setUpdate(null)} disabled={status === "installing"}>Later</button>
      </div>
    </aside>
  );
}
