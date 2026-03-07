# Remote Safety Release Runbook

This runbook aligns `Vercel Production` with the intended app revision and verifies that the linked remote Supabase project is consistent with the `project_members` model.

## Release inputs to record

- git SHA
- target migration version: `20260307000016`
- preview deployment URL
- production deployment URL
- audit report path before repair
- audit report path after repair
- previous production deployment URL for rollback

## 1. Freeze the release candidate

```sh
git status --short
git add <intended files>
git commit -m "Align production with project_members release"
git rev-parse HEAD
```

## 2. Run the remote audit

```sh
PROJECT_REF=$(cat supabase/.temp/project-ref)
SERVICE_ROLE_KEY=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json | jq -r '.[] | select(.name == "service_role") | .api_key')
SUPABASE_URL=$(sed -n 's/^VITE_SUPABASE_URL=//p' .env.local)

SUPABASE_URL="$SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
npm run audit:remote -- --output supabase/snapshots/remote-audit-before.json
```

- `blocking` counts must all be `0` before production promotion.
- `informational` findings are allowed only if they match the agreed legacy-placeholder posture.

## 3. If audit fails, repair with a forward-only migration

- Add a new migration under `supabase/migrations/`.
- Use data-preserving fixes only.
- Apply with `supabase db push`.
- Rerun the same audit and save a new report.

## 4. Verify Vercel environment values

```sh
vercel env pull /tmp/kadou-kanri.vercel.production.env --environment=production
vercel env pull /tmp/kadou-kanri.vercel.preview.env --environment=preview
```

Check that:

- `VITE_SUPABASE_URL` points at the linked project ref
- `VITE_SUPABASE_ANON_KEY` is from the same project ref

## 5. Validate the release candidate locally

```sh
npm run lint
npm test -- --run
npm run build
```

## 6. Deploy Preview

```sh
vercel --yes
```

Run smoke tests on Preview against remote data:

- login
- dashboard load
- member list/detail
- project list/detail
- assignment edit
- unconfirmed placeholder row display
- schedule monthly/period view
- export

## 7. Promote the exact same revision to Production

```sh
vercel --prod --yes
```

After deployment, re-run a short smoke test on Production:

- dashboard
- one project detail
- one schedule view
- one export

## Rollback inputs

- previous production deployment URL
- release git SHA
- audit reports before/after
- any repair migration IDs applied during this release
