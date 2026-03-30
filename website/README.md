# blackout.codes redirect (join links)

Deploy this folder to **blackout.codes** so that `https://blackout.codes/join/{sessionId}` redirects to the Blackout app (`blackout://join/{sessionId}`).

## Deploy

- **Vercel:** Connect the repo, set **Root Directory** to `website`, deploy. `vercel.json` rewrites `/join/:sessionId` to `join.html`.
- **Netlify:** Set **Publish directory** to `website`, deploy. `netlify.toml` handles the same rewrite.

After deployment, ensure the custom domain **blackout.codes** is set in the host’s dashboard and that DNS points to it.

## Behaviour

1. User opens `https://blackout.codes/join/ABC123` (e.g. by scanning the session QR with the system camera).
2. The server serves `join.html` (URL stays `/join/ABC123`).
3. `join.html` runs `location.replace('blackout://join/ABC123')`, so the OS opens the Blackout app.
4. If the app does not open, the page shows an “Open in Blackout app” link after ~1.5s.
