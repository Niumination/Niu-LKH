# PR Review & Execution Guide — Niu-LKH

This document tells a reviewing agent (or human) exactly how to review and, if approved, execute this PR against `Niu-LKH`.

## 1. Scope of the PR

- **Repo:** `Niumination/Niu-LKH`
- **Source branch (this work):** `arena/01a02917-niu-lkh`
- **Target branch:** `main`
- **Commits**
  - `395a25f` — chore: install autoskills skill stack for Niu-LKH
  - `(new HEAD commit)` — feat: apply 17 autoskills & harden Niu-LKH
- **Deliberately excluded:** `.github/workflows/ci.yml` is intentionally left untouched in this PR (per request; the GitHub App token used here lacks `workflows` permission).
- **Do NOT push to any other branch.** All git operations in this session must target `arena/01a02917-niu-lkh`.

## 2. What the PR does

| Category | Changes |
|---|---|
| Validation | `src/lib/validation.js` (Zod schemas: entry/profile, `safeParse`, refinements). `FormLKH` refactored from manual validation to React Hook Form + `zodResolver`. |
| Unit testing | `vitest.config.js`, `tests/unit/*` (validation, date, storage: 17 tests). `npm test`. |
| E2E | `playwright.config.js`, `tests/e2e/app.spec.js`. `npm run test:e2e` builds then runs. |
| TypeScript | `tsconfig.json`, `src/env.d.ts`, JSDoc/`z.infer` types. `npm run typecheck`. |
| UX / Design | Reusable UI (`src/components/ui`), design tokens + component layer in `src/index.css`, a11y, reduced motion. |
| SEO | `index.html` meta/OG/Twitter/JSON-LD, `public/robots.txt`, `public/sitemap.xml`, `public/manifest.webmanifest`. |
| Perf | Lazy routes/exports, Vite alias, chunk split, `es2022` target. |
| Supabase | `src/utils/supabaseService.js` explicit columns + batch upsert; `supabase/schema.sql` (PK, index, RLS). |
| Tooling/CI | `.nvmrc`, `scripts/check.sh` (`set -Eeuo pipefail`), package scripts. `.github/workflows/ci.yml` is intentionally unchanged in this PR. |
| Docs | `README.md`, `AGENTS.md`, `PR_REVIEW_GUIDE.md`. |

## 3. Review checklist

Run these **only on `arena/01a02917-niu-lkh`**.

```bash
# 1) Dependencies & lock consistency
npm install
node -e "console.log(require('./package.json').version, require('./package-lock.json').version)"

# 2) Static / type check
npm run typecheck

# 3) Unit tests
npm test

# 4) Production build
npm run build

# 5) Full gate (typecheck + tests + build)
npm run check

# 6) E2E (requires network access to download Playwright browsers once)
npx playwright install chromium   # one-time, outside CI if blocked
npm run test:e2e
```

**Expected results**
- `npm run typecheck` → exit 0, no output errors.
- `npm test` → 17/17 pass.
- `npm run build` → Vite builds 2007 modules, no warnings/errors, separate vendor chunks.
- `npm run check` → `[check] all checks passed.`
- `npm run test:e2e` → desktop + mobile Chromium pass (Dashboard, Form roles, navigation).

**Manual code-review focus**
1. `src/pages/FormLKH.jsx` — profile fields `gol/jabatan/unitKerja` are merged from `profile` into submitted `entry` (they are only rendered on the profile tab).
2. `src/lib/validation.js` — never use `parse()` on user input; all public entry points use `safeParse`.
3. `src/utils/storage.js` — `saveEntry`/`saveProfile` validate before writing.
4. `src/pages/History.jsx` — lazy-loads `src/utils/export` (no synchronous `jspdf`/`xlsx` import on route load).
5. Date helpers (`src/lib/date.js`) — never `new Date().toISOString().split('T')` for local dates; use `todayLocalISO()`.
6. `supabase/schema.sql` — RLS enabled; index on `tanggal`, `id`, `user_id`.

## 4. Known limitations & notes for the reviewer

- **Playwright browsers cannot be downloaded in some sandboxes** (e.g. `cdn.playwright.dev` blocked). If `npx playwright install chromium` fails with `ECONNRESET`, do NOT fail the PR on that alone; run it on a machine/CI with CDN access. Config + tests are valid.
- This is a **client-only** app plus Supabase/Apps Script. `nodejs-backend-patterns` is applied at the boundary (Supabase schema + CI), not by adding an HTTP server (no server exists).
- The Supabase anon key in `.env.production` and the Google Apps Script URL are **public-by-design** client secrets. Ensure Supabase RLS limits write access; do not treat the anon key as a private secret.
- `.agents/` + `skills-lock.json` are the installed autoskills skill stack; review them only for content integrity (SHA-verified) — they are not application code.

## 5. Approved-execution instructions for the agent

If the review is approved and the PR is to be landed:

1. Stay on `arena/01a02917-niu-lkh`.
2. Re-run the gate on the final head:
   ```bash
   npm install
   npm run check
   ```
3. Commit any review fixes on the same branch only.
4. Push the branch:
   ```bash
   git push origin arena/01a02917-niu-lkh
   ```
5. Open/attach the PR (if not already open):
   ```bash
   gh pr create --base main --head arena/01a02917-niu-lkh \
     --title "feat: apply 17 autoskills & harden Niu-LKH" \
     --body "$(cat PR_REVIEW_GUIDE.md)"
   ```
6. Confirm existing CI (`.github/workflows/ci.yml` on `main`) passes on the PR: build and (once enabled) deploy to GH Pages.
7. Merge only after `main` CI is green.

## 6. Rollback

If the PR must be reverted, keep the repo on the same branch and revert the feature commit(s) on top of `395a25f`. The skill-install commit `395a25f` may stay or be reverted separately if the team does not want `.agents/` committed.
