# Pollen UX & Data Source Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete source attribution, city switching, and nearby-city discovery while fixing local dev API proxying and improving code structure.

**Architecture:** Extract pure city directory and source metadata modules, build city-reference sorting around a dedicated `referenceCity` state, and keep UI changes thin by moving logic into reusable helpers. Use backend city directory API for searchable city options and frontend helpers for distance and display logic.

**Tech Stack:** Bun, Elysia, React, TypeScript, Vite, Leaflet, ECharts

---

## File Structure

- Create: `backend/src/cityDirectory.ts` — pure city metadata and lookup/search helpers
- Modify: `backend/src/scraper.ts` — import city directory from shared module
- Modify: `backend/src/index.ts` — expose city directory API
- Create: `backend/src/cityDirectory.test.ts` — Bun tests for backend city lookup/search helpers
- Create: `frontend/src/lib/pollenSources.ts` — source labels and source descriptions
- Create: `frontend/src/lib/cityReference.ts` — reference-city sorting, distance, query filtering
- Create: `frontend/src/lib/pollenSources.test.ts` — Bun tests for source metadata helpers
- Create: `frontend/src/lib/cityReference.test.ts` — Bun tests for frontend reference helpers
- Create: `frontend/src/components/CitySwitcher.tsx` — city search/switch UI
- Modify: `frontend/src/components/Map.tsx` — support focus city and source info in popup
- Modify: `frontend/src/components/CityDetailModal.tsx` — show source attribution details
- Modify: `frontend/src/App.tsx` — integrate reference city state and new components/helpers
- Modify: `frontend/src/App.css` — styles for switcher and source attribution
- Modify: `frontend/vite.config.ts` — add `/api` proxy

---

### Task 1: Extract backend city directory

**Files:**
- Create: `backend/src/cityDirectory.ts`
- Modify: `backend/src/scraper.ts`
- Create: `backend/src/cityDirectory.test.ts`

- [ ] Step 1: write failing Bun tests for city lookup/search behavior
- [ ] Step 2: run `bun test backend/src/cityDirectory.test.ts` and confirm failure
- [ ] Step 3: implement pure city directory module with major cities, expanded cities, nearest-city lookup, Chinese-name lookup, and searchable city options
- [ ] Step 4: update `backend/src/scraper.ts` to import shared city data/helpers
- [ ] Step 5: run `bun test backend/src/cityDirectory.test.ts` and confirm pass

### Task 2: Expose city options API

**Files:**
- Modify: `backend/src/index.ts`
- Test: `backend/src/cityDirectory.test.ts`

- [ ] Step 1: add failing test coverage for city search output shape in helper layer if needed
- [ ] Step 2: add `GET /api/city-options` endpoint using shared directory helpers
- [ ] Step 3: verify endpoint manually with `curl http://localhost:8080/api/city-options`
- [ ] Step 4: confirm existing `/api/cities` and `/api/my-city` still behave correctly

### Task 3: Extract frontend source metadata and reference-city helpers

**Files:**
- Create: `frontend/src/lib/pollenSources.ts`
- Create: `frontend/src/lib/cityReference.ts`
- Create: `frontend/src/lib/pollenSources.test.ts`
- Create: `frontend/src/lib/cityReference.test.ts`

- [ ] Step 1: write failing Bun tests for source labels/descriptions and reference-city sorting/filtering
- [ ] Step 2: run `bun test frontend/src/lib/pollenSources.test.ts frontend/src/lib/cityReference.test.ts` and confirm failure
- [ ] Step 3: implement pure helper modules
- [ ] Step 4: run `bun test frontend/src/lib/pollenSources.test.ts frontend/src/lib/cityReference.test.ts` and confirm pass

### Task 4: Build city switcher UI and reference-city flow

**Files:**
- Create: `frontend/src/components/CitySwitcher.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`

- [ ] Step 1: integrate `referenceCity` state and city options fetch in `App.tsx`
- [ ] Step 2: add city switcher UI with filtered options and clear/reset behavior
- [ ] Step 3: switch sidebar sorting and distance labels from `userLocation` to `referenceCity`
- [ ] Step 4: verify manual switch to listed city and expanded city both update nearby list

### Task 5: Add complete source attribution to UI

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Map.tsx`
- Modify: `frontend/src/components/CityDetailModal.tsx`
- Modify: `frontend/src/App.css`

- [ ] Step 1: add source badges to city list, banner, map popup, and detail modal
- [ ] Step 2: add footer source summary derived from actual day data
- [ ] Step 3: add source description block in city detail modal
- [ ] Step 4: verify weatherdt and qweather are both visibly distinguished on UI

### Task 6: Map focus and local dev fix

**Files:**
- Modify: `frontend/src/components/Map.tsx`
- Modify: `frontend/vite.config.ts`

- [ ] Step 1: add focus-city map behavior and optional reference marker
- [ ] Step 2: add Vite `/api` proxy to Bun backend
- [ ] Step 3: run dev server and verify `/api` requests no longer parse HTML as JSON

### Task 7: Final verification

**Files:**
- Verify only

- [ ] Step 1: run `bun test backend/src/cityDirectory.test.ts frontend/src/lib/pollenSources.test.ts frontend/src/lib/cityReference.test.ts`
- [ ] Step 2: run `bun run lint:frontend`
- [ ] Step 3: run `bun run build`
- [ ] Step 4: run backend locally and manually verify key flows in browser

