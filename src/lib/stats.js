// ---------- Team filter ----------
// "My team" = Titans A, Titans B, Tatva Titans (and spelling variants).
export const MY_TEAM_LABEL = "My Team";
export const MY_RE = /^(tatva\s+)?titans(\s*[-–]?\s*[ab])?$/i;

// sel: "" = my team, "*" = everyone, otherwise an exact team name
export const makeInc = (sel) => (t) =>
  sel === "*" || (sel === "" ? MY_RE.test(String(t).trim()) : t === sel);

export const balls = (o) => {
  const [a, b = "0"] = String(o).split(".");
  return +a * 6 + +b;
};

// Rows for one match, filtered to my team.
// bat   = batting rows of my team's innings
// bowl  = bowling rows when my team was fielding
// field = "how out" text of opposition batters (to credit my fielders)
export function sides(m, inc) {
  const teams = [...new Set(m.innings.map((i) => i.team))];
  const bat = [], bowl = [], field = [];
  m.innings.forEach((i) => {
    const fieldingTeam = teams.find((t) => t !== i.team) || "";
    if (inc(i.team)) bat.push(...i.bat);
    if (inc(fieldingTeam)) {
      bowl.push(...i.bowl);
      i.bat.forEach((x) => field.push(x[6] || ""));
    }
  });
  return { bat, bowl, field };
}

// "c Name b Bowler" -> catch, "st Name b Bowler" -> stumping, "run out (Name)" -> run-out
export function fld(st) {
  st = String(st || "").trim();
  let m;
  if ((m = st.match(/^c\s*&\s*b\s+(.+)$/))) return [{ n: m[1].trim(), k: "ct" }];
  if ((m = st.match(/^c\s+(.+?)\s+b\s+.+$/))) return [{ n: m[1].trim(), k: "ct" }];
  if ((m = st.match(/^st\s+(.+?)\s+b\s+.+$/))) return [{ n: m[1].trim(), k: "stp" }];
  if ((m = st.match(/^run out\s*\((.+?)\)?$/)))
    return m[1].split("/").map((n) => ({ n: n.trim(), k: "ro" }));
  return [];
}

const IMPACT = (p) => p.r + 25 * p.w + 0.3 * p.dots - 0.5 * p.ex + 10 * p.fd;

// Impact of every player in a single match
export function matchImpact(m, inc) {
  const o = {};
  const z = () => ({ r: 0, b: 0, w: 0, rc: 0, bl: 0, dots: 0, ex: 0, bat: 0, bow: 0, fd: 0 });
  const sd = sides(m, inc);
  sd.bat.forEach((x) => { const p = o[x[0]] || (o[x[0]] = z()); p.r += x[1]; p.b += x[2]; p.bat = 1; });
  sd.bowl.forEach((x) => {
    const p = o[x[0]] || (o[x[0]] = z());
    p.w += x[3]; p.rc += x[2]; p.bl += balls(x[1]); p.dots += x[4]; p.ex += x[5] + x[6]; p.bow = 1;
  });
  sd.field.forEach((st) => fld(st).forEach((q) => { (o[q.n] || (o[q.n] = z())).fd++; }));
  Object.values(o).forEach((p) => (p.imp = IMPACT(p)));
  return o;
}

// ---------- Leaderboard categories ----------
const CATEGORIES = [
  { k: "Highest Run Scorer", i: "🔥", d: "Most total runs", f: (p) => p.b > 0, s: (a, b) => b.r - a.r, v: (p) => p.r + " runs" },
  { k: "Top Wicket Taker", i: "🎯", d: "Most wickets · ties: better economy", f: (p) => p.w > 0, s: (a, b) => b.w - a.w || a.eco - b.eco, v: (p) => p.w + " wkts" },
  { k: "Defensive Batsman", i: "🛡️", d: "Lowest strike rate · min 10 balls", f: (p) => p.b >= 10, s: (a, b) => a.sr - b.sr, v: (p) => p.sr.toFixed(1) + " SR" },
  { k: "Hard Hitter", i: "💥", d: "Most runs from 4s and 6s", f: (p) => p.bnd > 0, s: (a, b) => b.bnd - a.bnd, v: (p) => p.bnd + " in boundaries" },
  { k: "All-round Performer", i: "⭐", d: "Bat + bowl · runs + 20 × wickets", f: (p) => p.bat && p.bow && p.bl > 0, s: (a, b) => b.r + 20 * b.w - (a.r + 20 * a.w), v: (p) => p.r + 20 * p.w + " pts" },
  { k: "Strike Rotator", i: "🔄", d: "Runs per non-boundary ball · min 10 balls faced", f: (p) => p.b >= 10, s: (a, b) => b.rot - a.rot, v: (p) => p.rot.toFixed(2) + " /ball" },
  { k: "Most Economical Bowler", i: "💎", d: "Lowest economy · min 4 overs", f: (p) => p.bl >= 24, s: (a, b) => a.eco - b.eco, v: (p) => p.eco.toFixed(2) + " eco" },
  {
    k: "Best Fielder", i: "🧤", d: "Catches + stumpings + run-outs",
    f: (p) => p.fd > 0, s: (a, b) => b.fd - a.fd || b.ct - a.ct,
    v: (p) => p.fd + " (" + p.ct + "c" + (p.stp ? " " + p.stp + "st" : "") + (p.ro ? " " + p.ro + "ro" : "") + ")",
  },
  {
    k: "Most Consistent Player", i: "📈", d: "High average impact with small match-to-match swings · min 2 matches",
    f: (p) => p.ms.length >= 2 && p.ma > 0, s: (a, b) => b.cons - a.cons,
    v: (p) => p.ma.toFixed(0) + " avg ±" + p.sd.toFixed(0),
  },
  {
    k: "Match Finisher", i: "🏁", d: "Fast, high-impact batting and not-out finishes · any batting position · min 15 balls",
    f: (p) => p.finB >= 15, s: (a, b) => b.fa - a.fa,
    v: (p) => p.fa.toFixed(0) + " pts/inn · SR " + p.sr.toFixed(0) + (p.finN ? " · " + p.finN + " chase finish" : ""),
  },
];

// ---------- Main calculation ----------
export function computeStats(matches, sel) {
  const inc = makeInc(sel);
  const P = {};
  const G = (n) =>
    P[n] ||
    (P[n] = {
      name: n, r: 0, b: 0, f: 0, s: 0, out: 0, bl: 0, rc: 0, w: 0, dots: 0, ex: 0, hs: 0, m: 0,
      bat: 0, bow: 0, ct: 0, stp: 0, ro: 0, fin: 0, finN: 0, finR: 0, finI: 0, finB: 0, top: 0, mid: 0, low: 0, ms: [],
    });

  matches.forEach((m) => {
    const seen = new Set();
    const sd = sides(m, inc);
    sd.bat.forEach((x) => {
      const p = G(x[0]);
      p.r += x[1]; p.b += x[2]; p.f += x[3]; p.s += x[4]; p.out += x[5];
      p.hs = Math.max(p.hs, x[1]); p.bat = 1; seen.add(x[0]);
    });
    sd.bowl.forEach((x) => {
      const p = G(x[0]);
      p.bl += balls(x[1]); p.rc += x[2]; p.w += x[3]; p.dots += x[4]; p.ex += x[5] + x[6];
      p.bow = 1; seen.add(x[0]);
    });
    sd.field.forEach((st) => fld(st).forEach((q) => { G(q.n)[q.k]++; seen.add(q.n); }));
    seen.forEach((n) => G(n).m++);
  });

  // impact of each match (for consistency + chart)
  matches.forEach((m) => {
    const o = matchImpact(m, inc);
    Object.keys(o).forEach((n) => { if (P[n]) P[n].ms.push(o[n].imp); });
  });

  // finisher: every innings counts, whatever the batting position
  matches.forEach((m) =>
    m.innings.forEach((i, k) => {
      if (!inc(i.team)) return;
      const won = (m.result || "").includes(i.team + " won");
      i.bat.forEach((x, ix) => {
        const p = G(x[0]);
        // batting-order slot: top order = positions 1-4, middle = 5-7, lower = 8+
        if (ix < 4) p.top++; else if (ix < 7) p.mid++; else p.low++;
        if (x[2] < 1) return;
        const notOut = !x[5] && !/retired/i.test(x[6] || "");
        const chaseWin = notOut && k === 1 && won;
        p.finI++; p.finR += x[1]; p.finB += x[2];
        p.fin += x[1] * (x[1] / x[2]) + (chaseWin ? 15 : notOut ? 5 : 0);
        if (chaseWin) p.finN++;
      });
    })
  );

  const players = Object.values(P);
  players.forEach((p) => {
    p.sr = p.b ? (p.r / p.b) * 100 : 0;
    p.bnd = p.f * 4 + p.s * 6;
    p.rot = p.b - p.f - p.s > 0 ? (p.r - p.bnd) / (p.b - p.f - p.s) : 0;
    p.eco = p.bl ? p.rc / (p.bl / 6) : 0;
    p.ov = Math.floor(p.bl / 6) + (p.bl % 6 ? "." + (p.bl % 6) : "");
    p.fd = p.ct + p.stp + p.ro;
    p.fa = p.finI ? p.fin / p.finI : 0;
    p.ma = p.ms.length ? p.ms.reduce((a, b) => a + b, 0) / p.ms.length : 0;
    p.sd = Math.sqrt(p.ms.reduce((a, b) => a + (b - p.ma) ** 2, 0) / (p.ms.length || 1));
    p.cons = p.ma > 0 ? p.ma * (1 - Math.min(1, p.sd / p.ma)) : 0;
    p.imp = IMPACT(p);
    p.role = p.bat && p.bow ? "All-rounder" : p.bow ? "Bowler" : p.bat ? "Batter" : p.fd ? "Fielder" : "No data yet";
  });

  const cats = CATEGORIES.map((c) => ({ ...c, top: players.filter(c.f).sort(c.s) }));
  players.forEach((p) => {
    p.badges = cats.filter((c) => c.top[0] && c.top[0].name === p.name).map((c) => c.i + " " + c.k);
  });
  return { players, byName: P, cats };
}

// ---------- Batting-order planner ----------
// Suggests the next top 4 so every player gets a turn in the top order.
//  fair = fewest top-4 innings first (pending players go first)
//  form = best batting form only
//  mix  = 2 best-form batters + 2 players still waiting for a top-order chance
export function suggestTop4(pool, mode) {
  const byForm = [...pool].sort((a, b) => b.fa - a.fa || b.imp - a.imp);
  const byFair = [...pool].sort((a, b) => a.top - b.top || b.fa - a.fa || b.imp - a.imp);
  let pick;
  if (mode === "form") pick = byForm.filter((p) => p.finI > 0).slice(0, 4);
  else if (mode === "fair") pick = byFair.slice(0, 4);
  else {
    const best = byForm.filter((p) => p.finI > 0).slice(0, 2);
    pick = [...best, ...byFair.filter((p) => !best.includes(p)).slice(0, 4 - best.length)];
  }
  for (const p of byForm) {
    if (pick.length >= 4) break;
    if (!pick.includes(p)) pick.push(p);
  }
  return pick.sort((a, b) => b.fa - a.fa);
}
