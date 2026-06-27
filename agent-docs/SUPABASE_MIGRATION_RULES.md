```md
# Supabase Migration Rules

Use migrations for every schema change.

Do:
- create migrations in `supabase/migrations`
- include tables, columns, indexes, constraints, triggers, and RLS policies
- test against a Supabase preview branch
- update generated TypeScript types if needed

Do not:
- manually edit production schema
- expose service role keys
- commit secrets
- run experimental migrations against production

Feature branches:
- schema-change issues must be tested with Supabase preview branches
- production migrations happen only after review and merge approval