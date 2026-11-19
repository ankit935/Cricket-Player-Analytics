// Player impact per match (blue) vs average impact of all players in that match (gold)
export default function Chart({ pts }) {
  if (!pts.length) return <small style={{ color: "var(--mu)" }}>No match data yet</small>;
  const mx = Math.max(50, ...pts.flatMap((q) => [q.p, q.a])) * 1.15;
  const X = (i) => (pts.length > 1 ? 50 + i * (340 / (pts.length - 1)) : 220);
  const Y = (v) => 190 - (Math.max(0, v) / mx) * 170;
  const line = (k) => pts.map((q, i) => X(i) + "," + Y(q[k])).join(" ");
  return (
    <>
      <svg viewBox="0 0 420 220" style={{ width: "100%" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1="40" x2="410" y1={Y(mx * f)} y2={Y(mx * f)} stroke="var(--bd)" />
            <text x="34" y={Y(mx * f) + 4} textAnchor="end" fontSize="10" fill="var(--mu)">
              {Math.round(mx * f)}
            </text>
          </g>
        ))}
        {pts.length > 1 && (
          <polygon points={`${X(0)},190 ${line("p")} ${X(pts.length - 1)},190`} fill="#078bdc" opacity=".18" />
        )}
        <polyline points={line("a")} fill="none" stroke="#e6b840" strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={line("p")} fill="none" stroke="#078bdc" strokeWidth="3" />
        {pts.map((q, i) => (
          <g key={i}>
            <circle cx={X(i)} cy={Y(q.a)} r="3.5" fill="#e6b840" />
            <circle cx={X(i)} cy={Y(q.p)} r="5" fill="#078bdc" stroke="#fff" strokeWidth="2" />
            <text x={X(i)} y={Y(q.p) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--tx)">
              {q.p.toFixed(0)}
            </text>
            <text x={X(i)} y="210" textAnchor="middle" fontSize="10" fill="var(--mu)">
              Match {q.k}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 12, color: "var(--mu)" }}>
        <span style={{ color: "#078bdc" }}>●</span> Player impact &nbsp;
        <span style={{ color: "#e6b840" }}>●</span> Match average
      </div>
    </>
  );
}
