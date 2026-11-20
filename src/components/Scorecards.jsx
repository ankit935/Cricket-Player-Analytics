import { useState } from "react";
import { balls, makeInc } from "../lib/stats";

const ovs = (bl) => Math.floor(bl / 6) + (bl % 6 ? "." + (bl % 6) : "");

// bat[name][matchIndex]  = { r, b, pos[], no }
// bowl[name][matchIndex] = { bl, r, w }
function buildMatrix(matches, inc) {
  const bat = {}, bowl = {};
  matches.forEach((m, mi) => {
    const teams = [...new Set(m.innings.map((i) => i.team))];
    m.innings.forEach((inn) => {
      const fieldingTeam = teams.find((t) => t !== inn.team) || "";
      if (inc(inn.team))
        inn.bat.forEach((x, i) => {
          const row = bat[x[0]] || (bat[x[0]] = []);
          const c = row[mi] || (row[mi] = { r: 0, b: 0, pos: [], no: true });
          c.r += x[1]; c.b += x[2]; c.pos.push(i + 1);
          if (x[5]) c.no = false;
        });
      if (inc(fieldingTeam))
        inn.bowl.forEach((x) => {
          const row = bowl[x[0]] || (bowl[x[0]] = []);
          const c = row[mi] || (row[mi] = { bl: 0, r: 0, w: 0 });
          c.bl += balls(x[1]); c.r += x[2]; c.w += x[3];
        });
    });
  });
  return { bat, bowl };
}

export default function Scorecards({ matches, players, team }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("side");
  const [bview, setBview] = useState("order");

  if (!matches.length)
    return (
      <div className="c lock">
        <div style={{ fontSize: 42 }}>📑</div>
        <h2 style={{ fontSize: 30, margin: "4px 0" }}>No matches yet</h2>
        <p style={{ color: "var(--mu)" }}>Upload scorecards in the Upload tab to see them here.</p>
      </div>
    );

  const inc = makeInc(team);
  const { bat, bowl } = buildMatrix(matches, inc);
  const key = q.trim().toLowerCase();
  const hit = (n) => (key && n.toLowerCase().includes(key) ? "hl" : "");
  const cols = matches.map((_, i) => i);

  // original scoreboard order: one column per innings of my team
  const icols = [];
  matches.forEach((m, mi) => m.innings.forEach((inn) => { if (inc(inn.team)) icols.push({ m, mi, inn }); }));
  const maxPos = Math.max(0, ...icols.map((c) => c.inn.bat.length));

  const sum = (row, f) => cols.reduce((a, i) => a + (row[i] ? f(row[i]) : 0), 0);
  const count = (row) => cols.filter((i) => row[i]).length;

  // ----- batting rows -----
  const batNames = Object.keys(bat).sort((a, b) => sum(bat[b], (c) => c.r) - sum(bat[a], (c) => c.r) || a.localeCompare(b));
  const notBatted = players.map((p) => p.name).filter((n) => !bat[n]).sort();
  // ----- bowling rows -----
  const bowlNames = Object.keys(bowl).sort((a, b) => {
    const wa = sum(bowl[a], (c) => c.w), wb = sum(bowl[b], (c) => c.w);
    const ea = sum(bowl[a], (c) => c.r) / (sum(bowl[a], (c) => c.bl) || 1);
    const eb = sum(bowl[b], (c) => c.r) / (sum(bowl[b], (c) => c.bl) || 1);
    return wb - wa || ea - eb;
  });

  const Head = ({ first, tot }) => (
    <tr>
      <th className="nm">{first}</th>
      {matches.map((m, i) => (
        <th key={m.id} title={m.title}>M{i + 1}<small>{m.date || ""}</small></th>
      ))}
      {tot.map((t, i) => <th key={t} className={i === 0 ? "tot" : ""}>{t}</th>)}
    </tr>
  );

  const batRow = (n) => {
    const row = bat[n] || [];
    const runs = sum(row, (c) => c.r), b = sum(row, (c) => c.b);
    const top4 = cols.reduce((a, i) => a + (row[i] ? row[i].pos.filter((p) => p <= 4).length : 0), 0);
    return (
      <tr key={n} className={hit(n)}>
        <td className="nm">{n}</td>
        {cols.map((i) => {
          const c = row[i];
          if (!c) return <td key={i} className="na">{bowl[n] && bowl[n][i] ? "DNB" : "–"}</td>;
          return (
            <td key={i} className={c.pos.some((p) => p <= 4) ? "t4" : ""}>
              <b>{c.r}{c.no && c.pos.length === 1 ? "*" : ""}</b> ({c.b})
              <small>No. {c.pos.join("/")} · SR {c.b ? ((c.r / c.b) * 100).toFixed(0) : "–"}</small>
            </td>
          );
        })}
        <td className="tot">{count(row)}</td>
        <td><b>{runs}</b></td>
        <td>{b ? ((runs / b) * 100).toFixed(0) : "–"}</td>
        <td>{top4}</td>
      </tr>
    );
  };

  const bowlRow = (n) => {
    const row = bowl[n];
    const bl = sum(row, (c) => c.bl), r = sum(row, (c) => c.r), w = sum(row, (c) => c.w);
    return (
      <tr key={n} className={hit(n)}>
        <td className="nm">{n}</td>
        {cols.map((i) => {
          const c = row[i];
          if (!c) return <td key={i} className="na">–</td>;
          return (
            <td key={i} className={c.w >= 3 ? "t4" : ""}>
              <b>{c.w}</b>/{c.r} ({ovs(c.bl)})
              <small>Eco {c.bl ? (c.r / (c.bl / 6)).toFixed(2) : "–"}</small>
            </td>
          );
        })}
        <td className="tot">{ovs(bl)}</td>
        <td>{r}</td>
        <td><b>{w}</b></td>
        <td>{bl ? (r / (bl / 6)).toFixed(2) : "–"}</td>
      </tr>
    );
  };

  const orderTable = (
    <table className="tbl mx">
      <thead>
        <tr>
          <th className="nm">Batting order</th>
          {icols.map((c, i) => (
            <th key={i} title={c.m.title}>M{c.mi + 1} · {c.inn.team}<small>{c.m.date || ""}</small></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxPos }, (_, pos) => (
          <tr key={pos}>
            <td className="nm">{pos < 4 ? <span className="tag b">No. {pos + 1}</span> : "No. " + (pos + 1)}</td>
            {icols.map((c, i) => {
              const x = c.inn.bat[pos];
              if (!x) return <td key={i} className="na">–</td>;
              const retired = /retired/i.test(x[6] || "");
              const mark = !x[5] && !retired ? "*" : retired ? " RH" : "";
              return (
                <td key={i} className={[pos < 4 ? "t4" : "", hit(x[0])].join(" ").trim()} title={x[6] || ""}>
                  <b>{x[0]}</b>
                  <small>{x[1]}{mark} ({x[2]})</small>
                </td>
              );
            })}
          </tr>
        ))}
        <tr className="tf">
          <td className="nm">Total</td>
          {icols.map((c, i) => <td key={i}>{c.inn.score}</td>)}
        </tr>
      </tbody>
    </table>
  );

  const legend = (
    <div style={{ fontSize: 12, color: "var(--mu)", display: "flex", gap: "4px 16px", flexWrap: "wrap" }}>
      {matches.map((m, i) => (
        <span key={m.id}><b>M{i + 1}</b> {m.title}{m.date ? " · " + m.date : ""}{m.result ? " · " + m.result : ""}</span>
      ))}
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button className={"btn" + (view === "side" ? "" : " o")} style={{ padding: "6px 16px", fontSize: 16 }} onClick={() => setView("side")}>All matches side by side</button>
        <button className={"btn" + (view === "match" ? "" : " o")} style={{ padding: "6px 16px", fontSize: 16 }} onClick={() => setView("match")}>Match wise</button>
        <input type="text" style={{ flex: 1, minWidth: 200, margin: 0 }} placeholder="🔎 Highlight a player…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {view === "side" ? (
        <>
          <div className="c" style={{ marginBottom: 12 }}>
            <div className="pt">Batting · all matches<small>Blue = top 4 · * = not out · RH = retired hurt</small></div>
            <div style={{ display: "flex", gap: 8, margin: "0 0 10px", flexWrap: "wrap" }}>
              <button className={"btn" + (bview === "order" ? "" : " o")} style={{ padding: "4px 14px", fontSize: 15 }} onClick={() => setBview("order")}>Batting order</button>
              <button className={"btn" + (bview === "player" ? "" : " o")} style={{ padding: "4px 14px", fontSize: 15 }} onClick={() => setBview("player")}>Player summary</button>
            </div>
            {bview === "order" ? (
              <div className="tw">{orderTable}</div>
            ) : (
              <div className="tw">
              <table className="tbl mx">
                <thead><Head first="Batter" tot={["Inns", "Runs", "SR", "Top 4"]} /></thead>
                <tbody>
                  {batNames.map(batRow)}
                  {notBatted.map(batRow)}
                </tbody>
              </table>
            </div>
            )}
            {legend}
          </div>

          <div className="c">
            <div className="pt">Bowling · all matches<small>Blue = 3+ wickets · cell = wickets/runs (overs)</small></div>
            <div className="tw">
              <table className="tbl mx">
                <thead><Head first="Bowler" tot={["Overs", "Runs", "Wkts", "Eco"]} /></thead>
                <tbody>{bowlNames.map(bowlRow)}</tbody>
              </table>
            </div>
            {!bowlNames.length && <small style={{ color: "var(--mu)" }}>No bowling data yet</small>}
            {legend}
          </div>
        </>
      ) : (
        [...matches].reverse().map((m, mi) => (
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
                    <thead><tr><th>#</th><th>Batter</th><th>How out</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                    <tbody>
                      {inn.bat.map((x, i) => (
                        <tr key={i} className={hit(x[0])}>
                          <td>{i < 4 ? <span className="tag b">{i + 1}</span> : i + 1}</td>
                          <td>{x[0]}</td>
                          <td className="mu">{x[6] || (x[5] ? "out" : "not out")}</td>
                          <td><b>{x[1]}</b></td><td>{x[2]}</td><td>{x[3]}</td><td>{x[4]}</td>
                          <td>{x[2] ? ((x[1] / x[2]) * 100).toFixed(1) : "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pt">Bowling vs {inn.team}</div>
                <div className="tw">
                  <table className="tbl">
                    <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th><th>Dots</th><th>Wd</th><th>Nb</th></tr></thead>
                    <tbody>
                      {inn.bowl.map((x, i) => (
                        <tr key={i} className={hit(x[0])}>
                          <td>{x[0]}</td><td>{x[1]}</td><td>{x[2]}</td><td><b>{x[3]}</b></td>
                          <td>{balls(x[1]) ? (x[2] / (balls(x[1]) / 6)).toFixed(2) : "–"}</td>
                          <td>{x[4]}</td><td>{x[5]}</td><td>{x[6]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </details>
        ))
      )}
    </>
  );
}
