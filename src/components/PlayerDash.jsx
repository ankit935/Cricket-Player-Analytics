import { useState } from "react";
import Chart from "./Chart";
import { makeInc, matchImpact } from "../lib/stats";

const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

export default function PlayerDash({ stats, matches, team, cur, onPick }) {
  const [q, setQ] = useState("");
  const { players, byName, cats } = stats;

  if (!players.length)
    return (
      <div className="c lock">
        <div style={{ fontSize: 42 }}>🏏</div>
        <h2 style={{ fontSize: 30, margin: "4px 0" }}>No matches yet</h2>
        <p style={{ color: "var(--mu)" }}>Open the Upload tab and add scorecard PDFs to get started.</p>
      </div>
    );

  const sorted = [...players].sort((a, b) => b.imp - a.imp);
  const name = byName[cur] ? cur : sorted[0].name;
  const p = byName[name];

  const inc = makeInc(team);
  const per = matches.map((m) => matchImpact(m, inc));

  const pts = [];
  per.forEach((o, k) => {
    const x = o[name];
    if (x) {
      const all = Object.values(o);
      pts.push({ k: k + 1, p: x.imp, a: all.reduce((s, y) => s + y.imp, 0) / all.length });
    }
  });

  const recent = [];
  matches.forEach((m, k) => {
    const x = per[k][name];
    if (!x) return;
    const line = [
      x.bat ? `${x.r} (${x.b})` : "",
      x.bow ? `${x.w}/${x.rc} in ${Math.floor(x.bl / 6)}${x.bl % 6 ? "." + (x.bl % 6) : ""} ov` : "",
      x.fd ? `${x.fd} fielding` : "",
    ].filter(Boolean).join(" · ");
    recent.unshift({ id: m.id, title: m.title, date: m.date, line });
  });

  const ranks = cats
    .map((c) => {
      const i = c.top.findIndex((x) => x.name === name);
      return i < 0 ? null : { k: c.k, i: c.i, pos: i + 1, v: c.v(p) };
    })
    .filter(Boolean);

  const list = sorted.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
  const stat = [
    [p.m, "Matches"], [p.r, "Total runs"], [p.w, "Wickets"],
    [p.hs, "Highest"], [p.b ? p.sr.toFixed(0) : "–", "Strike rate"], [p.bl ? p.eco.toFixed(1) : "–", "Economy"],
    [p.fd, "Dismissals"], [`${p.f}/${p.s}`, "4s / 6s"], [p.imp.toFixed(0), "Impact"],
  ];

  return (
    <div className="dash">
      <div>
        <div className="hero">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
          <div>
            <h2>{p.name}</h2>
            <small>{p.role}</small>
            <div style={{ marginTop: 8 }}>
              {p.badges.map((b) => (
                <span key={b} className="tag b" style={{ background: "#ffffff26", borderColor: "#fff4" }}>{b}</span>
              ))}
            </div>
          </div>
          <div className="hs">
            {stat.map(([v, l]) => (
              <div key={l}><b>{v}</b><span>{l}</span></div>
            ))}
          </div>
        </div>

        <div className="pn">
          <div className="pt">Performance rating<small>Impact per match</small></div>
          <Chart pts={pts} />
        </div>

        <div className="two">
          <div className="pn">
            <div className="pt">Category ranks</div>
            {ranks.length ? ranks.map((r) => (
              <div className="chip" key={r.k}><span>{r.i} {r.k}</span><b>#{r.pos} · {r.v}</b></div>
            )) : <small style={{ color: "var(--mu)" }}>Not ranked in any category yet</small>}
          </div>
          <div className="pn">
            <div className="pt">Recent matches</div>
            {recent.length ? recent.map((r) => (
              <div className="chip" key={r.id}>
                <span>{r.title}<br /><small style={{ color: "var(--mu)" }}>{r.date}</small></span>
                <b>{r.line}</b>
              </div>
            )) : <small style={{ color: "var(--mu)" }}>No matches</small>}
          </div>
        </div>
      </div>

      <aside className="roster">
        <div className="pt">Team roster</div>
        <input type="text" placeholder="Search player…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div id="rl">
          {list.map((x) => (
            <div key={x.name} className={"ro" + (x.name === name ? " on" : "")} onClick={() => onPick(x.name)}>
              <div className="av">{initials(x.name)}</div>
              <div>
                <b>{x.name}</b>
                <small>{x.role} · Impact {x.imp.toFixed(0)}</small>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
