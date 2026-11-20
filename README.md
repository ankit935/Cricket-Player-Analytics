# Cricket Analytics Tool (React + Vite)

Player performance tracker built from CricHeroes scorecards.
Leaders, player dashboard, Squad-of-15 builder, match list and a password-protected PDF upload.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```
Needs Node.js 18+.

## Folder guide
```
public/matches.json        <- match data shown to everyone (edit/replace this file)
public/logo.png            <- team logo
src/lib/stats.js           <- all calculations (impact, consistency, finisher, fielding...)
src/lib/parser.js          <- reads CricHeroes PDFs in the browser
src/components/            <- Sidebar, Header, Leaders, PlayerDash, Chart, Squad, BattingOrder, Matches, Upload
src/App.jsx                <- state + layout
src/styles.css             <- theme (Rajdhani + Inter, #078bdc)
.github/workflows/deploy.yml  <- auto-deploy to GitHub Pages
```

## Deploy free on GitHub Pages
1. Create a repo and push everything in this folder to the `main` branch.
2. Repo -> Settings -> Pages -> **Source: GitHub Actions**.
3. Every push to `main` builds and publishes the site.
   URL: `https://<username>.github.io/<repo-name>/`

## Adding new matches
1. Open the site -> Upload tab -> enter the password -> choose the PDFs.
2. Click **Download matches.json**.
3. Replace `public/matches.json` in the repo with that file and commit.
   (Uploads are stored only in your own browser until you do this.)

## Notes
- The upload password is stored as a SHA-256 hash in `src/components/Upload.jsx`.
  This only hides the tab; a public website cannot truly protect it.
- "My team" = Titans A, Titans B, Tatva Titans (see `MY_RE` in `src/lib/stats.js`).
