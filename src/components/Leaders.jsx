export default function Leaders({ cats, onPick }) {
  return (
    <div className="g">
      {cats.map((c) => {
        const top = c.top.slice(0, 5);
        const first = top[0];
        return (
          <div className="c" key={c.k}>
            <div className="ch">
              <div className="ic">{c.i}</div>
              <div>
                <h3>{c.k}</h3>
                <small>{c.d}</small>
              </div>
            </div>
            {first ? (
              <>
                <div className="top" onClick={() => onPick(first.name)}>
                  <div>
                    <small>#1</small>
                    <b>{first.name}</b>
                  </div>
                  <em>{c.v(first)}</em>
                </div>
                {top.slice(1).map((p, i) => (
                  <div className="r" key={p.name} onClick={() => onPick(p.name)}>
                    <span className="n">{i + 2}</span>
                    <span>{p.name}</span>
                    <span className="v">{c.v(p)}</span>
                  </div>
                ))}
              </>
            ) : (
              <small>No data yet</small>
            )}
          </div>
        );
      })}
    </div>
  );
}
