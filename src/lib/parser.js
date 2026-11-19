// Reads a CricHeroes scorecard PDF in the browser and returns a match object.
let pdfjs;
async function loadPdf() {
  if (!pdfjs) {
    const mod = await import("pdfjs-dist");
    const lib = mod.getDocument ? mod : mod.default;
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.js?url")).default;
    lib.GlobalWorkerOptions.workerSrc = worker;
    pdfjs = lib;
  }
  return pdfjs;
}

async function pdfLines(file) {
  const lib = await loadPdf();
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const out = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    const rows = [];
    content.items
      .filter((i) => i.str.trim())
      .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])
      .forEach((i) => {
        const y = i.transform[5];
        const r = rows.find((r) => Math.abs(r.y - y) < 3);
        r ? r.t.push(i) : rows.push({ y, t: [i] });
      });
    rows.forEach((r) =>
      out.push(
        r.t.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str.trim()).join(" ")
          .replace(/†/g, "").replace(/\s+/g, " ").trim()
      )
    );
  }
  return out;
}

const HEAD = /^(.+?)\s+(\d+\/\d+)\s+\(([\d.]+)\s*Ov\)\s*\(\d+\w*\s*Innings\)/;
const BAT = /^\d+\s+(.+?)\s*(?:\([^)]*\)\s*)*\((?:RHB|LHB)\)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)$/;
const BOWL = /^\d+\s+(.+?)\s+(\d+(?:\.\d)?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseLines(lines) {
  const txt = lines.join(" ");
  const innings = [];
  let cur = null;
  lines.forEach((l) => {
    let m;
    if ((m = l.match(HEAD))) {
      cur = { team: m[1].trim(), score: `${m[2]} (${m[3]})`, bat: [], bowl: [] };
      innings.push(cur);
    } else if (cur && (m = l.match(BAT))) {
      // [name, runs, balls, 4s, 6s, out(1/0), how-out text]
      cur.bat.push([m[1].trim(), +m[3], +m[4], +m[6], +m[7], /not out|retired/i.test(m[2]) ? 0 : 1, m[2].trim()]);
    } else if (cur && (m = l.match(BOWL))) {
      // [name, overs, runs, wickets, dots, wides, noballs]
      cur.bowl.push([m[1].replace(/\s*\([^)]*\)/g, "").trim(), m[2], +m[4], +m[5], +m[6], +m[9], +m[10]]);
    }
  });
  if (!innings.length || !innings.some((i) => i.bat.length)) throw new Error("no scorecard rows found");

  const short = (t) => t.replace(/^Tatva\s+/i, "");
  const d = txt.match(/Date\s+(\d{4})-(\d{2})-(\d{2})/);
  const ri = txt.lastIndexOf("Result ");
  const rt = ri < 0 ? "" : txt.slice(ri + 7);
  const r = rt.match(/^(.*?won by \d+ \w+)/i) || rt.match(/^(.*?(?:tied|no result|abandoned))/i);

  const match = {
    title: innings.map((i) => short(i.team)).join(" vs "),
    date: d ? `${+d[3]} ${MONTHS[+d[2] - 1]} ${d[1]}` : "",
    venue: "",
    result: r ? short(r[1]) : "",
    innings: innings.map((i) => ({ ...i, team: short(i.team) })),
  };
  const key = (d ? d[0] : "") + innings.map((i) => i.team + i.score).join("|");
  match.id = "m" + [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return match;
}

export async function parseFile(file) {
  if (/\.json$/i.test(file.name)) {
    const j = JSON.parse(await file.text());
    return (Array.isArray(j) ? j : [j]).map((m) => ({
      ...m,
      id: m.id || "m" + Date.now() + Math.random().toString(36).slice(2, 6),
    }));
  }
  return [parseLines(await pdfLines(file))];
}
