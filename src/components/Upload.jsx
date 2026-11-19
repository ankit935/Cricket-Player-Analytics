import { useState } from "react";
import { parseFile } from "../lib/parser";

// SHA-256 of the upload password (the password itself is not stored in the code).
// NOTE: this only hides the tab. A public website cannot truly protect a password.
const HASH = "7a19ed377df87c3fe90bce639be73342a6e963ff918ea614256961e696402c22";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Upload({ matches, onAdd, onDelete, toast }) {
  const [ok, setOk] = useState(() => {
    try { return sessionStorage.getItem("cat_ok") === "1"; } catch { return false; }
  });
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [log, setLog] = useState([]);

  async function unlock() {
    if ((await sha256(pw)) === HASH) {
      try { sessionStorage.setItem("cat_ok", "1"); } catch { /* ignore */ }
      setOk(true);
    } else {
      setErr("Wrong password");
      setPw("");
    }
  }

  function lock() {
    try { sessionStorage.removeItem("cat_ok"); } catch { /* ignore */ }
    setOk(false);
    setPw("");
    setErr("");
  }

  async function upload(files) {
    const rows = [];
    let added = 0;
    for (const f of files) {
      const row = { n: f.name, t: "⏳ " + f.name };
      rows.push(row);
      setLog([...rows]);
      try {
        const parsed = await parseFile(f);
        for (const m of parsed) {
          const status = onAdd(m);
          row.t = status === "dup" ? `↩︎ ${f.name}: already added` : `✅ ${f.name}: ${m.title}`;
          if (status !== "dup") added++;
        }
      } catch (e) {
        row.t = `❌ ${f.name}: couldn’t read this file (${e.message})`;
      }
      setLog([...rows]);
    }
    if (added) toast(`${added} match${added > 1 ? "es" : ""} added`);
  }

  function download() {
    const blob = new Blob([JSON.stringify(matches, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "matches.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  if (!ok)
    return (
      <div className="c lock">
        <div style={{ fontSize: 42 }}>🔒</div>
        <h2 style={{ fontSize: 30, margin: "4px 0" }}>Captains only</h2>
        <p style={{ color: "var(--mu)" }}>Enter the password to upload match scorecards.</p>
        <input
          type="password" placeholder="Password" value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
        />
        <div className="err">{err}</div>
        <button className="btn" onClick={unlock}>Unlock</button>
      </div>
    );

  return (
    <div className="c">
      <div className="ch">
        <div className="ic">⬆️</div>
        <div>
          <h3>Upload matches</h3>
          <small>Select one or many CricHeroes scorecard PDFs at once</small>
        </div>
      </div>
      <label className="drop">
        <b>Tap to choose files</b>PDF scorecards (or JSON)
        <input
          type="file" accept=".pdf,.json" multiple hidden
          onChange={(e) => { upload([...e.target.files]); e.target.value = ""; }}
        />
      </label>
      <div style={{ fontSize: 13 }}>{log.map((r, i) => <div key={i}>{r.t}</div>)}</div>

      <h3 style={{ margin: "16px 0 4px", fontSize: 20 }}>Matches in the tracker</h3>
      {matches.map((m) => (
        <div className="mr" key={m.id}>
          <span>{m.title}<br /><small style={{ color: "var(--mu)" }}>{m.date || ""}</small></span>
          <button
            className="btn o" style={{ padding: "6px 14px", fontSize: 15 }}
            onClick={() => window.confirm("Delete this match?") && onDelete(m.id)}
          >Delete</button>
        </div>
      ))}
      <p style={{ marginTop: 14 }}>
        <button className="btn o" onClick={download}>⬇ Download matches.json</button>{" "}
        <button className="btn o" onClick={lock}>Lock again</button>
      </p>
    </div>
  );
}
