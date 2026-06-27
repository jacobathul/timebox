# Timebox Agent Playbook

You are working on the Timebox app.

Production domain:
https://timebox.athuljacob.com

Tech stack:
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Vercel
- Namecheap DNS

Branching rules:
1. Never work directly on main.
2. Prefer branching from staging.
3. If staging does not exist, branch from main.
4. Every feature gets its own branch.
5. Every PR should target staging first.
6. Main is production.

Default workflow:
```bash
git status
git checkout staging
git pull origin staging
git checkout -b feature/<feature-name>

If staging does not exist:

git checkout main
git pull origin main
git checkout -b feature/<feature-name>

Database rules:

Any Supabase schema change must be done through a migration file in supabase/migrations.
Do not manually change production Supabase.
Do not expose service role keys in frontend code.
Do not commit .env.local.
Test schema changes against a Supabase preview branch.

UI rules:

Keep desktop layout polished.
Mobile must not be a squeezed desktop layout.
No horizontal overflow on mobile.
Use accessible buttons and touch targets.

Testing before commit:

Run TypeScript check if available.
Run npm run build.
Test affected routes.
Test mobile viewport if UI changed.
Check for console errors.

PR output:
Every PR should include:

summary
screenshots if UI changed
migration files if schema changed
test results
known risks