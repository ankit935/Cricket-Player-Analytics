export default function Squad({ players, sel, onToggle }) {
  const sorted = [...players].sort((a, b) => b.imp - a.imp);
  const mix = {};
  players.filter((p) => sel.has(p.name)).forEach((p) => { mix[p.role] = (mix[p.role] || 0) + 1; });
  const mixText = Object.entries(mix).map(([r, n]) => n + " " + r).join(" · ") || "–";
  return (
    <>
      <div className="cnt"><span>{sel.size}</span> / 15 picked</div>
      <p style={{ color: "var(--mu)", margin: "0 0 12px" }}>
        Ranked by Impact (runs + 25×wkts + 10×dismissals + 0.3×dots − 0.5×extras). Tap to add or remove. Mix: {mixText}
      </p>
      {sorted.map((p, i) => (
        <div key={p.name} className={"sq" + (sel.has(p.name) ? " in" : "")} onClick={() => onToggle(p.name)}>
          <div>
            <b>{i + 1}. {p.name}</b><br />
            <small>{p.role} · {p.r} runs · {p.w} wkts · Impact {p.imp.toFixed(0)}</small>
          </div>
          <span className="pill">{sel.has(p.name) ? "IN" : "OUT"}</span>
        </div>
      ))}
    </>
  );
}
