const TABS = [
  ["lead", "🏆", "Leaders"],
  ["pl", "👤", "Players"],
  ["sq", "✅", "Squad 15"],
  ["mt", "📋", "Matches"],
  ["up", "🔒", "Upload"],
];

export default function Sidebar({ tab, setTab }) {
  return (
    <nav id="nav">
      <img className="lg" src={`${import.meta.env.BASE_URL}logo.png`} alt="Cricket Analytics Tool" />
      {TABS.map(([key, icon, label]) => (
        <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
          <i>{icon}</i>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
