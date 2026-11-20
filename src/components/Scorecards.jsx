import { useState } from "react";
import { balls } from "../lib/stats";

// All matches: batting + bowling scorecards, plus a "who has batted" summary.
export default function Scorecards({ matches, players }) {
  const [q, setQ] = useState("");

  if (!matches.length)
    return (
      <div className="c lock">
        <div style={{ fontSize: 42 }}>📑</div>
        <h2 style={{ fontSize: 30, margin: "4px 0" }}>No matches yet</h2>
        <p style={{ color: "var(--mu)" }}>Upload scorecards in the Upload tab to see them here.</p>
      </div>
    );

  const key = q.trim().toLowerCase();
  const hit = (name) => key && name.toLowerCase().includes(key);
  const inns = (p) => p.top + p.mid + p.low; // innings batted
  const byName = (a, b) => a.name.localeCompare(b.name);
  const batted = players.filter((p) => inns(p) > 0).sort((a, b) => inns(b) - inns(a) || byName(a, b));
  const notBatted = players.filter((p) => inns(p) === 0).sort(byName);

  return (
    <>
      <div className="c" style={{ marginBottom: 12 }}>
        <div className="ch">
          <div className="ic">🏏</div>
          <div>
            <h3>Who has batted so far</h3>
            <small>{batted.length} batted · {notBatted.length} not batted yet · {matches.length} match{matches.length > 1 ? "es" : ""}</small>
          </div>
        </div>
        <div className="pt">Already batted<small>× innings</small></div>
        <div style={{ marginBottom: 10 }}>
          {batted.map((p) => (
            <span key={p.name} className="tag b">{p.name} ×{inns(p)}</span>
          ))}
          {!batted.length && <small style={{ color: "var(--mu)" }}>Nobody yet</small>}
        </div>
        <div className="pt">Not batted yet</div>
        <div>
          {notBatted.map((p) => (
            <span key={p.name} className="tag">{p.name}</span>
          ))}
          {!notBatted.length && <small style={{ color: "var(--mu)" }}>Everyone has batted 🎉</small>}
        </div>
      </div>

      <input type="text" placeholder="🔎 Highlight a player in all scorecards…" value={q} onChange={(e) => setQ(e.target.value)} />

      {[...matches].reverse().map((m, mi) => (
        <details className="c sc" key={m.id} open={mi === 0}>
          <summary>
            {m.title}
            <small>{m.date || ""}{m.venue ? " · " + m.venue : ""}{m.result ? " · " + m.result : ""}</small>
          </summary>

          {m.innings.map((inn, k) => (
            <div key={k}>
              <div className="pt">{inn.team} · {inn.score}<small>Batting</small></div>
              <div className="tw">
                <table className="tbl">
                  <thead>
                    <tr><th>#</th><th>Batter</th><th>How out</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>
                  </thead>
                  <tbody>
                    {inn.bat.map((x, i) => (
                      <tr key={i} className={hit(x[0]) ? "hl" : ""}>
                        <td>{i < 4 ? <span className="tag b">{i + 1}</span> : i + 1}</td>
                        <td>{x[0]}</td>
                        <td className="mu">{x[6] || (x[5] ? "out" : "not out")}</td>
                        <td><b>{x[1]}</b></td>
                        <td>{x[2]}</td>
                        <td>{x[3]}</td>
                        <td>{x[4]}</td>
                        <td>{x[2] ? ((x[1] / x[2]) * 100).toFixed(1) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt">Bowling vs {inn.team}<small>Top-4 batting slots are marked blue</small></div>
              <div className="tw">
                <table className="tbl">
                  <thead>
                    <tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th><th>Dots</th><th>Wd</th><th>Nb</th></tr>
                  </thead>
                  <tbody>
                    {inn.bowl.map((x, i) => (
                      <tr key={i} className={hit(x[0]) ? "hl" : ""}>
                        <td>{x[0]}</td>
                        <td>{x[1]}</td>
                        <td>{x[2]}</td>
                        <td><b>{x[3]}</b></td>
                        <td>{balls(x[1]) ? (x[2] / (balls(x[1]) / 6)).toFixed(2) : "–"}</td>
                        <td>{x[4]}</td>
                        <td>{x[5]}</td>
                        <td>{x[6]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </details>
      ))}
    </>
  );
}
