import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Leaders from "./components/Leaders.jsx";
import PlayerDash from "./components/PlayerDash.jsx";
import Squad from "./components/Squad.jsx";
import Matches from "./components/Matches.jsx";
import Upload from "./components/Upload.jsx";
import { computeStats } from "./lib/stats";

const TITLES = {
  lead: "Leaderboards",
  pl: "Player Dashboard",
  sq: "Pick your 15",
  mt: "Matches",
  up: "Upload scorecards",
};

// a match must have innings with bat/bowl lists, otherwise ignore it
const valid = (m) =>
  m && Array.isArray(m.innings) && m.innings.every((i) => i && Array.isArray(i.bat) && Array.isArray(i.bowl));

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

export default function App() {
  const [tab, setTab] = useState("lead");
  const [repo, setRepo] = useState([]);                 // public/matches.json
  const [local, setLocal] = useState(() => load("cat_local", []).filter(valid)); // uploaded on this device
  const [team, setTeam] = useState(() => load("cat_team", ""));
  const [cur, setCur] = useState(null);                  // selected player
  const [picked, setPicked] = useState(null);            // manual squad choice (null = auto top 15)
  const [msg, setMsg] = useState("");

  // matches.json is committed in the repo and shared with everyone
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}matches.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => Array.isArray(j) && setRepo(j.filter(valid)))
      .catch(() => {});
  }, []);

  const matches = useMemo(() => {
    const seen = new Set();
    return [...repo, ...local].filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
  }, [repo, local]);

  // keeps the latest list available inside async upload loops
  const allRef = useRef([]);
  allRef.current = matches;

  const teams = useMemo(() => [...new Set(matches.flatMap((m) => m.innings.map((i) => i.team)))], [matches]);
  const sel = team === "" || team === "*" || teams.includes(team) ? team : "";
  const stats = useMemo(() => computeStats(matches, sel), [matches, sel]);

  const auto = useMemo(
    () => new Set([...stats.players].sort((a, b) => b.imp - a.imp).slice(0, 15).map((p) => p.name)),
    [stats]
  );
  const squad = picked || auto;

  const timer = useRef(null);
  const toast = (t) => {
    setMsg(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3800);
  };

  const onTeam = (v) => { setTeam(v); save("cat_team", v); setPicked(null); setCur(null); };
  const onPick = (name) => { setCur(name); setTab("pl"); window.scrollTo(0, 0); };
  const onToggle = (name) => {
    const next = new Set(squad);
    if (next.has(name)) next.delete(name);
    else if (next.size < 15) next.add(name);
    else return toast("You already have 15. Remove one first.");
    setPicked(next);
  };

  const onAdd = (m) => {
    if (allRef.current.some((x) => x.id === m.id)) return "dup";
    allRef.current = [...allRef.current, m];
    setLocal((prev) => {
      const next = [...prev, m];
      save("cat_local", next);
      return next;
    });
    return "ok";
  };
  const onDelete = (id) => {
    setLocal((prev) => { const next = prev.filter((m) => m.id !== id); save("cat_local", next); return next; });
    setRepo((prev) => prev.filter((m) => m.id !== id));
  };

  const kpi = [
    [matches.length, "Matches"],
    [stats.players.length, "Players"],
    [stats.players.reduce((a, p) => a + p.r, 0), "Runs"],
    [stats.players.reduce((a, p) => a + p.w, 0), "Wickets"],
  ];

  return (
    <div className="app">
      <Sidebar tab={tab} setTab={setTab} />
      <div className="main">
        <Header title={TITLES[tab]} team={sel} teams={teams} onTeam={onTeam} kpi={kpi} />
        <main>
          {tab === "lead" && <Leaders cats={stats.cats} onPick={onPick} />}
          {tab === "pl" && <PlayerDash stats={stats} matches={matches} team={sel} cur={cur} onPick={setCur} />}
          {tab === "sq" && <Squad players={stats.players} sel={squad} onToggle={onToggle} />}
          {tab === "mt" && <Matches matches={matches} />}
          {tab === "up" && <Upload matches={matches} onAdd={onAdd} onDelete={onDelete} toast={toast} />}
        </main>
        <p className="note">
          Strike rotation = (runs − boundary runs) ÷ (balls faced − 4s − 6s). The scorecard doesn’t list singles, so this is an estimate.
          Consistency = average match impact × (1 − swing), where swing = standard deviation ÷ average (needs 2+ matches).
          Finisher = average per innings of runs × strike rate ÷ 100, plus 15 for finishing not out in a winning chase (5 for any other not-out); batting position is ignored, min 15 balls faced.
        </p>
        <footer className="ft">
          © <span>{new Date().getFullYear()}</span> <span>Cricket Analytics Tool</span> · All rights reserved by <b>Ankit Vora</b>
        </footer>
      </div>
      {msg && <div className="toast" style={{ display: "block" }}>{msg}</div>}
    </div>
  );
}
