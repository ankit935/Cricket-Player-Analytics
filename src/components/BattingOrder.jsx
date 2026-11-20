import { useState } from "react";
import { suggestTop4 } from "../lib/stats";

const MODES = [
  ["mix", "Balanced"],
  ["fair", "Fair rotation"],
  ["form", "Best form"],
];
const INFO = {
  mix: "2 best-form batters + 2 players still waiting for a top-order chance.",
  fair: "Players with the fewest top-4 innings go first, so everyone gets a turn.",
  form: "The 4 batters in the best form, ignoring who has already had a turn.",
};

const reason = (p) =>
  p.top === 0
    ? "Pending: no top-4 innings yet"
    : `Top-4 innings: ${p.top} · Form ${p.fa.toFixed(0)} pts/inn`;

export default function BattingOrder({ players, squad }) {
  const [mode, setMode] = useState("mix");
  const [onlySquad, setOnlySquad] = useState(true);

  if (!players.length)
    return (
      <div className="c lock">
        <div style={{ fontSize: 42 }}>🏏</div>
        <h2 style={{ fontSize: 30, margin: "4px 0" }}>No matches yet</h2>
        <p style={{ color: "var(--mu)" }}>Upload scorecards first to plan the batting order.</p>
      </div>
    );

  const pool = players.filter((p) => !onlySquad || squad.has(p.name));
  const pick = suggestTop4(pool, mode);
  const picked = new Set(pick.map((p) => p.name));
  const pending = pool.filter((p) => p.top === 0 && !picked.has(p.name)).sort((a, b) => b.fa - a.fa);
  const had = players.filter((p) => p.top > 0).sort((a, b) => b.top - a.top || b.fa - a.fa);
  const waiting = players.filter((p) => p.top === 0).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="g">
      <div className="c" style={{ gridColumn: "1 / -1" }}>
        <div className="ch">
          <div className="ic">🎯</div>
          <div>
            <h3>Suggested top 4 for next match</h3>
            <small>{INFO[mode]}</small>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          {MODES.map(([k, label]) => (
            <button key={k} className={"btn" + (mode === k ? "" : " o")} style={{ padding: "6px 16px", fontSize: 16 }} onClick={() => setMode(k)}>
              {label}
            </button>
          ))}
          <label style={{ marginLeft: "auto", fontSize: 13, color: "var(--mu)", cursor: "pointer" }}>
            <input type="checkbox" checked={onlySquad} onChange={(e) => setOnlySquad(e.target.checked)} /> Squad 15 only
          </label>
        </div>
        {pick.map((p, i) => (
          <div className="sq in" key={p.name} style={{ cursor: "default" }}>
            <div>
              <b>No. {i + 1} · {p.name}</b><br />
              <small>{reason(p)}</small>
            </div>
            <span className="pill">{p.top === 0 ? "PENDING" : "TURN " + (p.top + 1)}</span>
          </div>
        ))}
        {!pick.length && <small style={{ color: "var(--mu)" }}>No players in the squad yet.</small>}
      </div>

      <div className="c">
        <div className="ch">
          <div className="ic">⏳</div>
          <div>
            <h3>Still waiting ({waiting.length})</h3>
            <small>No top-4 innings yet. They should get a chance soon.</small>
          </div>
        </div>
        {waiting.map((p) => (
          <div className="chip" key={p.name}>
            <span>{p.name}{pending.includes(p) ? " ⏭" : ""}</span>
            <b>{p.finI ? `batted ${p.finI}× lower` : "not batted yet"}</b>
          </div>
        ))}
        {!waiting.length && <small style={{ color: "var(--mu)" }}>Everyone has had a top-order turn 🎉</small>}
      </div>

      <div className="c">
        <div className="ch">
          <div className="ic">✅</div>
          <div>
            <h3>Had top-order chances ({had.length})</h3>
            <small>Innings batting at No. 1–4 so far</small>
          </div>
        </div>
        {had.map((p) => (
          <div className="chip" key={p.name}>
            <span>{p.name}</span>
            <b>Top-4 ×{p.top}{p.mid ? ` · Mid ×${p.mid}` : ""}{p.low ? ` · Low ×${p.low}` : ""}</b>
          </div>
        ))}
        {!had.length && <small style={{ color: "var(--mu)" }}>No top-order data yet</small>}
      </div>
    </div>
  );
}
