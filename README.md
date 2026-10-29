# Calm & Focus – setup

Upload this whole folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, Vercel). Everything works without a backend: tools, streaks, progress, sharing, sleep timer and the installable app.

## Turn on login + leaderboard (optional, free)
1. Create a project at supabase.com.
2. SQL Editor: paste `schema.sql` and run it.
3. Authentication > Email Templates > "Magic Link": add `{{ .Token }}` to the body so people get a one-time code (the link also works).
4. Authentication > URL Configuration: set Site URL to your domain and add `https://yourdomain.com/index.html` to Redirect URLs.
5. Project Settings > API: copy the Project URL and anon/publishable key into `config.js`.

Scores come from the browser, so a determined user can fake one; the SQL functions reject impossible values only.
Bump `V` in `sw.js` whenever you change site files so installed apps update.
