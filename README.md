# portfolio.rishit.site — rishit_os

vite + react 19 + react-three-fiber + gsap + lenis + matter-js. no template. every word lives in `src/data/content.js`.

```
npm i
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run snapshot   # refresh the offline github fallback (src/data/snapshot.json)
```

## things only you can fill in
- `public/resume.pdf` — the resume path. change `ME.resume` in `content.js` if the old site used another name.
- `public/certificates/cert_1.jpg … cert_40.jpg` — until they exist the museum shows drawn placeholders.
- `public/os/` — the old site. right now it's a stub `index.html`; copy the old build over it.
- project blurbs in `content.js` (problem / built / impact) were written from repo names. fix whatever i guessed.

## how it hangs together
- one clock: lenis, scrolltrigger, every r3f canvas and every 2d canvas run off `gsap.ticker`.
- `src/ui/GL.jsx` is the only way a canvas gets made: mounts near the viewport, pauses off-screen, dpr <= 1.5.
- each world is a lazy chunk (`src/worlds.js`) and brings its own css. nothing loads until you're about a screen away.
- github data: `src/lib/github.js` (rest api + jogruber contributions api, 30 min cache, falls back to `snapshot.json`).
- "view source" on any world imports the real file with `?raw`.

## dev tools
`npm run build && npx vite preview --port 4173`, then `npm run shots` (screenshots + fps per world) or `npm run e2e` (pokes every easter egg).
