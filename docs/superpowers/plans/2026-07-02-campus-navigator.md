# Campus Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Campus Navigator" section to the EBISION 2026 home page that lets attendees pick two on-campus locations and see the computed walking route between them.

**Architecture:** A hand-curated JSON routing graph (`data/2026/{locale}/campus-graph.json`) is loaded server-side via the existing `loadData()` helper and handed to a client component that runs a dependency-free Dijkstra shortest-path function and renders the route as an inline SVG diagram with a plain-text step summary. No map vendor, no external routing API, no runtime network calls.

**Tech Stack:** Next.js server/client components, next-intl (`useTranslations` / `getTranslations`), shadcn `Select`/`Button` components, Vitest + Testing Library.

## Global Constraints

- No new npm dependencies — pathfinding is a hand-written ~40-line function, rendering is plain SVG.
- Data files follow the existing per-year/per-locale pattern (`data/{year}/{locale}/<name>.json`, loaded via `loadData<T>(filename, year)` from `lib/data.ts`).
- Do not copy or hotlink Kookmin University's official campus map image (© 2018 Kookmin University, All Rights Reserved) — the schematic diagram is drawn from scratch.
- The feature is scoped to 2026 only (2025's venue was an off-campus hotel, not a campus) — do not add `campus-graph.json` for 2025.
- Confirmed node data: **#1 Administration Hall** (Main Conference Hall, 1F), **#11 International Hall** (Paper Sessions, 5F, rooms 501/502/506), **#4 College of Law** (Lunch, 5F). Entry point and inter-building distances are placeholders pending organizer confirmation — mark them with a `notes` field in the JSON, not code comments.
- Translation keys follow the existing per-page-namespace pattern in `messages/en.json` / `messages/kr.json` (e.g. the existing `"Venue": {...}` block).

---

### Task 1: Campus pathfinding core logic

**Files:**
- Create: `lib/campus-pathfinding.ts`
- Test: `__tests__/lib/campus-pathfinding.test.ts`

**Interfaces:**
- Consumes: nothing (pure, standalone module)
- Produces:
  - `interface CampusNode { id: string; name: string; description?: string; x: number; y: number }`
  - `interface CampusEdge { from: string; to: string; distanceMeters: number }`
  - `interface CampusGraphData { notes?: string; nodes: CampusNode[]; edges: CampusEdge[] }`
  - `interface PathResult { path: string[]; totalDistanceMeters: number }`
  - `function findShortestPath(graph: CampusGraphData, fromId: string, toId: string): PathResult | null`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/campus-pathfinding.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findShortestPath, type CampusGraphData } from "@/lib/campus-pathfinding";

const testGraph: CampusGraphData = {
  nodes: [
    { id: "a", name: "A", x: 0, y: 0 },
    { id: "b", name: "B", x: 100, y: 0 },
    { id: "c", name: "C", x: 200, y: 0 },
    { id: "d", name: "D", x: 300, y: 0 },
  ],
  edges: [
    { from: "a", to: "b", distanceMeters: 100 },
    { from: "b", to: "c", distanceMeters: 50 },
    { from: "a", to: "c", distanceMeters: 200 },
  ],
};

describe("findShortestPath", () => {
  it("finds the shortest path across multiple hops, preferring the cheaper multi-hop route over a longer direct edge", () => {
    const result = findShortestPath(testGraph, "a", "c");
    expect(result).toEqual({ path: ["a", "b", "c"], totalDistanceMeters: 150 });
  });

  it("returns a single-node path with zero distance when from equals to", () => {
    const result = findShortestPath(testGraph, "a", "a");
    expect(result).toEqual({ path: ["a"], totalDistanceMeters: 0 });
  });

  it("returns null when no path exists between disconnected nodes", () => {
    const result = findShortestPath(testGraph, "a", "d");
    expect(result).toBeNull();
  });

  it("returns null when either node id does not exist in the graph", () => {
    expect(findShortestPath(testGraph, "a", "nonexistent")).toBeNull();
    expect(findShortestPath(testGraph, "nonexistent", "a")).toBeNull();
  });

  it("treats edges as undirected", () => {
    const result = findShortestPath(testGraph, "c", "a");
    expect(result).toEqual({ path: ["c", "b", "a"], totalDistanceMeters: 150 });
  });

  it("ignores edges that reference a node id not present in nodes", () => {
    const graphWithBadEdge: CampusGraphData = {
      nodes: testGraph.nodes,
      edges: [...testGraph.edges, { from: "a", to: "ghost", distanceMeters: 5 }],
    };
    const result = findShortestPath(graphWithBadEdge, "a", "c");
    expect(result).toEqual({ path: ["a", "b", "c"], totalDistanceMeters: 150 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run __tests__/lib/campus-pathfinding.test.ts`
Expected: FAIL with `Cannot find module '@/lib/campus-pathfinding'` (or similar resolution error) since the module doesn't exist yet.

- [ ] **Step 3: Implement the module**

Create `lib/campus-pathfinding.ts`:

```ts
export interface CampusNode {
  id: string;
  name: string;
  description?: string;
  x: number;
  y: number;
}

export interface CampusEdge {
  from: string;
  to: string;
  distanceMeters: number;
}

export interface CampusGraphData {
  notes?: string;
  nodes: CampusNode[];
  edges: CampusEdge[];
}

export interface PathResult {
  path: string[];
  totalDistanceMeters: number;
}

/**
 * Plain Dijkstra over a hand-curated campus graph (~20 nodes at most) —
 * a full priority-queue implementation isn't worth it at this scale.
 */
export function findShortestPath(
  graph: CampusGraphData,
  fromId: string,
  toId: string,
): PathResult | null {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (!nodeIds.has(fromId) || !nodeIds.has(toId)) {
    return null;
  }

  const adjacency = new Map<string, { neighbor: string; distance: number }[]>();
  for (const id of nodeIds) {
    adjacency.set(id, []);
  }
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      continue;
    }
    adjacency.get(edge.from)?.push({ neighbor: edge.to, distance: edge.distanceMeters });
    adjacency.get(edge.to)?.push({ neighbor: edge.from, distance: edge.distanceMeters });
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const unvisited = new Set(nodeIds);
  for (const id of nodeIds) {
    distances.set(id, Number.POSITIVE_INFINITY);
  }
  distances.set(fromId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const id of unvisited) {
      const distance = distances.get(id) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        currentDistance = distance;
        currentId = id;
      }
    }

    if (currentId === null || currentDistance === Number.POSITIVE_INFINITY) {
      break;
    }
    unvisited.delete(currentId);
    if (currentId === toId) {
      break;
    }

    for (const { neighbor, distance } of adjacency.get(currentId) ?? []) {
      if (!unvisited.has(neighbor)) {
        continue;
      }
      const candidate = currentDistance + distance;
      if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, candidate);
        previous.set(neighbor, currentId);
      }
    }
  }

  const totalDistanceMeters = distances.get(toId) ?? Number.POSITIVE_INFINITY;
  if (totalDistanceMeters === Number.POSITIVE_INFINITY) {
    return null;
  }

  const path: string[] = [toId];
  let step = toId;
  while (step !== fromId) {
    const prev = previous.get(step);
    if (!prev) {
      return null;
    }
    path.unshift(prev);
    step = prev;
  }

  return { path, totalDistanceMeters };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run __tests__/lib/campus-pathfinding.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/campus-pathfinding.ts __tests__/lib/campus-pathfinding.test.ts
git commit -m "feat: add dependency-free Dijkstra pathfinding for campus navigator"
```

---

### Task 2: Campus graph data files

**Files:**
- Create: `data/2026/en/campus-graph.json`
- Create: `data/2026/kr/campus-graph.json`
- Test: `__tests__/data/campus-graph.test.ts`

**Interfaces:**
- Consumes: `CampusGraphData`, `findShortestPath` from `lib/campus-pathfinding.ts` (Task 1)
- Produces: JSON files loadable via `loadData<CampusGraphData>("campus-graph", 2026)`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/data/campus-graph.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import en from "@/data/2026/en/campus-graph.json";
import kr from "@/data/2026/kr/campus-graph.json";
import { findShortestPath, type CampusGraphData } from "@/lib/campus-pathfinding";

describe.each([
  ["en", en as CampusGraphData],
  ["kr", kr as CampusGraphData],
])("campus-graph.json (%s)", (_locale, graph) => {
  it("has every edge referencing a node that exists", () => {
    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it("includes the three confirmed EBISION 2026 conference buildings", () => {
    const nodeIds = graph.nodes.map((node) => node.id);
    expect(nodeIds).toEqual(
      expect.arrayContaining(["administration-hall", "international-hall", "college-of-law"]),
    );
  });

  it("connects every node to the campus entrance", () => {
    for (const node of graph.nodes) {
      if (node.id === "campus-entrance") {
        continue;
      }
      const result = findShortestPath(graph, "campus-entrance", node.id);
      expect(result).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run __tests__/data/campus-graph.test.ts`
Expected: FAIL — cannot find `@/data/2026/en/campus-graph.json` (file doesn't exist yet).

- [ ] **Step 3: Create the English data file**

Create `data/2026/en/campus-graph.json`:

```json
{
  "notes": "Distances and the campus entrance position are estimated placeholders. Confirm exact inter-building distances and the real arrival point (gate/parking lot/bus stop) with the EBISION 2026 organizing committee before launch.",
  "nodes": [
    {
      "id": "campus-entrance",
      "name": "Campus Entrance",
      "description": "Near the parking lot and the \"국민대입구\" bus stop/intersection — TODO: confirm exact arrival point",
      "x": 120,
      "y": 800
    },
    {
      "id": "administration-hall",
      "name": "Administration Hall",
      "description": "Main Conference Hall — 1F",
      "x": 450,
      "y": 500
    },
    {
      "id": "international-hall",
      "name": "International Hall",
      "description": "Paper Sessions — 5F, rooms 501, 502, 506",
      "x": 620,
      "y": 430
    },
    {
      "id": "college-of-law",
      "name": "College of Law",
      "description": "Lunch — 5F",
      "x": 560,
      "y": 260
    }
  ],
  "edges": [
    { "from": "campus-entrance", "to": "administration-hall", "distanceMeters": 300 },
    { "from": "administration-hall", "to": "international-hall", "distanceMeters": 80 },
    { "from": "international-hall", "to": "college-of-law", "distanceMeters": 60 },
    { "from": "administration-hall", "to": "college-of-law", "distanceMeters": 120 }
  ]
}
```

- [ ] **Step 4: Create the Korean data file**

Create `data/2026/kr/campus-graph.json`:

```json
{
  "notes": "거리와 캠퍼스 입구 위치는 추정값입니다. 정확한 건물 간 거리와 실제 출발 지점(정문/주차장/버스정류장), 공식 한글 건물명을 EBISION 2026 조직위원회에 확인 후 반영해야 합니다.",
  "nodes": [
    {
      "id": "campus-entrance",
      "name": "캠퍼스 입구",
      "description": "주차장 및 \"국민대입구\" 버스정류장 인근 — TODO: 정확한 출발 지점 확인 필요",
      "x": 120,
      "y": 800
    },
    {
      "id": "administration-hall",
      "name": "본관",
      "description": "메인 컨퍼런스 홀 — 1층",
      "x": 450,
      "y": 500
    },
    {
      "id": "international-hall",
      "name": "국제관",
      "description": "논문 발표 세션 — 5층, 501, 502, 506호",
      "x": 620,
      "y": 430
    },
    {
      "id": "college-of-law",
      "name": "법과대학",
      "description": "점심 식사 — 5층",
      "x": 560,
      "y": 260
    }
  ],
  "edges": [
    { "from": "campus-entrance", "to": "administration-hall", "distanceMeters": 300 },
    { "from": "administration-hall", "to": "international-hall", "distanceMeters": 80 },
    { "from": "international-hall", "to": "college-of-law", "distanceMeters": 60 },
    { "from": "administration-hall", "to": "college-of-law", "distanceMeters": 120 }
  ]
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run __tests__/data/campus-graph.test.ts`
Expected: PASS (6 tests — 3 checks × 2 locales)

- [ ] **Step 6: Commit**

```bash
git add data/2026/en/campus-graph.json data/2026/kr/campus-graph.json __tests__/data/campus-graph.test.ts
git commit -m "feat: add initial EBISION 2026 campus routing graph data"
```

---

### Task 3: Translation keys

**Files:**
- Modify: `messages/en.json:299` (insert new namespace after the `"Venue"` block, which ends at line 304)
- Modify: `messages/kr.json:299` (same insertion point)

**Interfaces:**
- Consumes: nothing
- Produces: `"CampusNavigator"` translation namespace with keys `label`, `title`, `description`, `fromLabel`, `toLabel`, `fromPlaceholder`, `toPlaceholder`, `findPathButton`, `noPathFound`, `totalDistance`, `walkingTime`. Consumed by Task 4's components via `useTranslations("CampusNavigator")` / `getTranslations("CampusNavigator")`.

- [ ] **Step 1: Add the namespace to `messages/en.json`**

Find this exact block (around line 300):

```json
  "Venue": {
    "aboutVenue": "About the Venue",
    "gettingThere": "Getting There",
    "visitOfficialWebsite": "Visit Official Website"
  },
```

Replace it with:

```json
  "Venue": {
    "aboutVenue": "About the Venue",
    "gettingThere": "Getting There",
    "visitOfficialWebsite": "Visit Official Website"
  },
  "CampusNavigator": {
    "label": "On-Campus Navigation",
    "title": "Campus Navigator",
    "description": "Find the walking route between key conference locations on campus.",
    "fromLabel": "From",
    "toLabel": "To",
    "fromPlaceholder": "Select starting point",
    "toPlaceholder": "Select destination",
    "findPathButton": "Find Path",
    "noPathFound": "No route found between these locations — please check with the registration desk.",
    "totalDistance": "{distance}m total",
    "walkingTime": "~{minutes} min walk"
  },
```

- [ ] **Step 2: Add the namespace to `messages/kr.json`**

Find this exact block (around line 300):

```json
  "Venue": {
    "aboutVenue": "행사장 소개",
    "gettingThere": "오시는 길",
    "visitOfficialWebsite": "공식 웹사이트 방문"
  },
```

Replace it with:

```json
  "Venue": {
    "aboutVenue": "행사장 소개",
    "gettingThere": "오시는 길",
    "visitOfficialWebsite": "공식 웹사이트 방문"
  },
  "CampusNavigator": {
    "label": "캠퍼스 내 길찾기",
    "title": "캠퍼스 내비게이터",
    "description": "주요 행사 장소 간 도보 경로를 확인하세요.",
    "fromLabel": "출발지",
    "toLabel": "도착지",
    "fromPlaceholder": "출발지를 선택하세요",
    "toPlaceholder": "도착지를 선택하세요",
    "findPathButton": "경로 찾기",
    "noPathFound": "두 장소 사이의 경로를 찾을 수 없습니다. 등록 데스크에 문의해 주세요.",
    "totalDistance": "총 {distance}m",
    "walkingTime": "도보 약 {minutes}분"
  },
```

- [ ] **Step 3: Verify both files are still valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json', 'utf8')); JSON.parse(require('fs').readFileSync('messages/kr.json', 'utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/kr.json
git commit -m "feat: add CampusNavigator translation keys"
```

---

### Task 4: CampusNavigator components

**Files:**
- Create: `modules/landing/home/components/CampusNavigatorClient.tsx`
- Create: `modules/landing/home/components/CampusNavigator.tsx`
- Test: `__tests__/components/campus-navigator-client.test.tsx`

**Interfaces:**
- Consumes:
  - `findShortestPath`, `type CampusGraphData` from `lib/campus-pathfinding.ts` (Task 1)
  - `campus-graph.json` data via `loadData<CampusGraphData>("campus-graph", year)` from `lib/data.ts` (Task 2 provides the data; `loadData` already exists)
  - `"CampusNavigator"` translation namespace (Task 3)
  - `Button` from `@/components/ui/button`, `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` from `@/components/ui/select`
  - `type ValidYear` from `@/constants/config`
- Produces: `CampusNavigator` default export, a `{ year: ValidYear }` server component — this is what Task 5 renders on the home page.

- [ ] **Step 1: Write the failing test for the client component**

Create `__tests__/components/campus-navigator-client.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CampusNavigatorClient from "@/modules/landing/home/components/CampusNavigatorClient";
import type { CampusGraphData } from "@/lib/campus-pathfinding";

const graph: CampusGraphData = {
  nodes: [
    { id: "a", name: "Point A", x: 0, y: 0 },
    { id: "b", name: "Point B", x: 100, y: 0 },
    { id: "c", name: "Point C", x: 200, y: 0 },
  ],
  edges: [{ from: "a", to: "b", distanceMeters: 100 }],
};

describe("CampusNavigatorClient", () => {
  it("disables the Find Path button until both endpoints are selected", () => {
    render(<CampusNavigatorClient graph={graph} />);
    expect(screen.getByRole("button", { name: /findPathButton/i })).toBeDisabled();
  });

  it("renders the computed route after selecting endpoints and clicking Find Path", async () => {
    const user = userEvent.setup();
    render(<CampusNavigatorClient graph={graph} />);

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    await user.click(fromSelect);
    await user.click(await screen.findByRole("option", { name: "Point A" }));

    await user.click(toSelect);
    await user.click(await screen.findByRole("option", { name: "Point B" }));

    await user.click(screen.getByRole("button", { name: /findPathButton/i }));

    expect(screen.getByText("Point A → Point B")).toBeInTheDocument();
  });

  it("shows the no-path-found message for disconnected locations", async () => {
    const user = userEvent.setup();
    render(<CampusNavigatorClient graph={graph} />);

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    await user.click(fromSelect);
    await user.click(await screen.findByRole("option", { name: "Point A" }));

    await user.click(toSelect);
    await user.click(await screen.findByRole("option", { name: "Point C" }));

    await user.click(screen.getByRole("button", { name: /findPathButton/i }));

    expect(screen.getByText("noPathFound")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run __tests__/components/campus-navigator-client.test.tsx`
Expected: FAIL — cannot find module `@/modules/landing/home/components/CampusNavigatorClient`.

- [ ] **Step 3: Implement `CampusNavigatorClient.tsx`**

Create `modules/landing/home/components/CampusNavigatorClient.tsx`:

```tsx
"use client";

import { Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CampusGraphData, type PathResult, findShortestPath } from "@/lib/campus-pathfinding";

const WALKING_METERS_PER_MINUTE = 80;
const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const CampusNavigatorClient = ({ graph }: { graph: CampusGraphData }) => {
  const t = useTranslations("CampusNavigator");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [result, setResult] = useState<PathResult | null | undefined>(undefined);

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);

  const handleFindPath = () => {
    setResult(findShortestPath(graph, fromId, toId));
  };

  return (
    <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-6`}>
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex flex-col gap-2 w-full sm:w-1/3">
          <label className="small-heading text-foreground" htmlFor="campus-navigator-from">
            {t("fromLabel")}
          </label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger id="campus-navigator-from" className="w-full">
              <SelectValue placeholder={t("fromPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {graph.nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-1/3">
          <label className="small-heading text-foreground" htmlFor="campus-navigator-to">
            {t("toLabel")}
          </label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger id="campus-navigator-to" className="w-full">
              <SelectValue placeholder={t("toPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {graph.nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleFindPath}
          disabled={!fromId || !toId || fromId === toId}
          className="w-full sm:w-auto"
        >
          <Navigation className="h-4 w-4" />
          {t("findPathButton")}
        </Button>
      </div>

      {result === null && <p className="body text-muted-foreground">{t("noPathFound")}</p>}

      {result && (
        <div className="flex flex-col gap-4">
          <svg
            viewBox="0 0 1000 1000"
            role="img"
            aria-label={t("title")}
            className="w-full h-64 sm:h-80 border border-border rounded-lg bg-background/40"
          >
            {graph.edges.map((edge) => {
              const a = nodeById.get(edge.from);
              const b = nodeById.get(edge.to);
              if (!a || !b) {
                return null;
              }
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--border)"
                  strokeWidth={4}
                />
              );
            })}
            {result.path.slice(0, -1).map((nodeId, index) => {
              const a = nodeById.get(nodeId);
              const b = nodeById.get(result.path[index + 1]);
              if (!a || !b) {
                return null;
              }
              return (
                <line
                  key={`path-${nodeId}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--primary)"
                  strokeWidth={8}
                  strokeLinecap="round"
                />
              );
            })}
            {graph.nodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={14}
                  fill={result.path.includes(node.id) ? "var(--primary)" : "var(--muted-foreground)"}
                />
                <text x={node.x} y={node.y - 20} textAnchor="middle" fill="var(--foreground)" fontSize={24}>
                  {node.name}
                </text>
              </g>
            ))}
          </svg>

          <p className="body text-foreground">
            {result.path.map((id) => nodeById.get(id)?.name ?? id).join(" → ")}
          </p>
          <p className="caption text-muted-foreground">
            {t("totalDistance", { distance: result.totalDistanceMeters })} ·{" "}
            {t("walkingTime", {
              minutes: Math.max(1, Math.round(result.totalDistanceMeters / WALKING_METERS_PER_MINUTE)),
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default CampusNavigatorClient;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run __tests__/components/campus-navigator-client.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Implement the server wrapper `CampusNavigator.tsx`**

Create `modules/landing/home/components/CampusNavigator.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";
import type { CampusGraphData } from "@/lib/campus-pathfinding";
import CampusNavigatorClient from "./CampusNavigatorClient";

const CampusNavigator = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("CampusNavigator");
  const graph = await loadData<CampusGraphData>("campus-graph", year);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="tag text-primary">{t("label")}</p>
        <h2 className="title text-foreground">{t("title")}</h2>
        <p className="body text-muted-foreground max-w-2xl">{t("description")}</p>
      </div>
      <CampusNavigatorClient graph={graph} />
    </div>
  );
};

export default CampusNavigator;
```

This is a server component with no independent unit test (consistent with the rest of this codebase — `Venue.tsx` and other async server components under `modules/landing/` have no direct unit tests either, since `getTranslations`/`loadData` need request-scoped context that isn't unit-tested here). It's covered by Task 5's manual verification.

- [ ] **Step 6: Run the full test suite to check nothing broke**

Run: `npx vitest run`
Expected: All tests pass, including the 3 new files from Tasks 1, 2, and 4.

- [ ] **Step 7: Commit**

```bash
git add modules/landing/home/components/CampusNavigatorClient.tsx modules/landing/home/components/CampusNavigator.tsx __tests__/components/campus-navigator-client.test.tsx
git commit -m "feat: add CampusNavigator server and client components"
```

---

### Task 5: Wire into the home page

**Files:**
- Modify: `modules/landing/home/components/HomePage.tsx`

**Interfaces:**
- Consumes: `CampusNavigator` default export from `./CampusNavigator` (Task 4)
- Produces: nothing new — this is the final integration point.

- [ ] **Step 1: Import the component**

In `modules/landing/home/components/HomePage.tsx`, find this import block:

```tsx
import CallForPapers from "./CallForPapers";
import ImageCarousel from "./ImageCarousel";
import Venue from "./Venue";
```

Replace it with:

```tsx
import CallForPapers from "./CallForPapers";
import CampusNavigator from "./CampusNavigator";
import ImageCarousel from "./ImageCarousel";
import Venue from "./Venue";
```

- [ ] **Step 2: Render it after the Venue section**

Find this block:

```tsx
      {/* ── Venue Section ── */}
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="max-w-8xl mx-auto">
          <Venue year={year} />
        </div>
      </section>

      {/* ── Call for Papers Section ── */}
```

Replace it with:

```tsx
      {/* ── Venue Section ── */}
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="max-w-8xl mx-auto">
          <Venue year={year} />
        </div>
      </section>

      {/* ── Campus Navigator Section (2026 only — 2025's venue was an off-campus hotel) ── */}
      {year === 2026 && (
        <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
          <div className="max-w-8xl mx-auto">
            <CampusNavigator year={year} />
          </div>
        </section>
      )}

      {/* ── Call for Papers Section ── */}
```

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: All tests still pass.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, then open `http://localhost:3000/2026` in a browser.

- Scroll to the "Campus Navigator" section (below Venue, above Call for Papers).
- Select "Campus Entrance" as From and "International Hall" as To, click "Find Path" — confirm the SVG diagram highlights a route and the text below reads "Campus Entrance → Administration Hall → International Hall" with a distance/time line.
- Select the same location for both From and To — confirm the "Find Path" button is disabled.
- Open `http://localhost:3000/2025` — confirm the Campus Navigator section does **not** appear (2025 has no campus-graph.json and is a hotel venue).
- Switch the language toggle to Korean on the 2026 page — confirm all labels and building names render in Korean.

- [ ] **Step 5: Commit**

```bash
git add modules/landing/home/components/HomePage.tsx
git commit -m "feat: add Campus Navigator section to the 2026 home page"
```

---

## Post-implementation follow-up (not part of this plan's tasks)

- The organizing committee still needs to confirm: the real campus entrance/arrival point, accurate inter-building walking distances, and official Korean building names. These are simple JSON edits to `data/2026/{en,kr}/campus-graph.json` — no code changes required. Flagged in the `notes` field of both files.
