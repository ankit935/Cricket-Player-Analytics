import { MY_TEAM_LABEL } from "../lib/stats";

export default function Header({ title, team, teams, onTeam, kpi }) {
  return (
    <div className="bar">
      <div>
        <small className="brand">Cricket Analytics Tool</small>
        <h1>{title}</h1>
      </div>
      <select id="tf" value={team} onChange={(e) => onTeam(e.target.value)} title="Team filter">
        <option value="">{MY_TEAM_LABEL}</option>
        {teams.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
        <option value="*">Everyone</option>
      </select>
      <div className="kp">
        {kpi.map(([value, label]) => (
          <div key={label}>
            <b>{value}</b>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
