export default function Matches({ matches }) {
  if (!matches.length) return <p style={{ color: "var(--mu)" }}>No matches yet.</p>;
  return [...matches].reverse().map((m) => (
    <div className="c" style={{ marginBottom: 12 }} key={m.id}>
      <div className="ch">
        <div className="ic">🏏</div>
        <div>
          <h3>{m.title}</h3>
          <small>{m.date || ""} {m.venue ? "· " + m.venue : ""}</small>
        </div>
      </div>
      <p style={{ margin: "0 0 6px" }}><b>{m.result || ""}</b></p>
      {m.innings.map((i) => (
        <span className="tag b" key={i.team}>{i.team} {i.score}</span>
      ))}
    </div>
  ));
}
