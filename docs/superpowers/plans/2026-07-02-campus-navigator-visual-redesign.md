# Campus Navigator Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder "Campus Entrance" node with Kookmin's real, numbered Main Gate (25), add official building numbers to the other confirmed nodes, and redesign the SVG diagram to render numbered building badges on a simplified campus-map background instead of plain dots.

**Architecture:** Extend the existing `CampusNode` type with an optional `number` field, update the two `campus-graph.json` data files and their integrity test accordingly, then rewrite the SVG rendering inside the existing `CampusNavigatorClient.tsx` client component — no new files, no new libraries, no image assets.

**Tech Stack:** Same as the existing feature — Next.js client component, inline SVG, Vitest + Testing Library.

## Global Constraints

- No new npm dependencies, no image assets, no third-party map vendor — everything renders from the existing hand-curated JSON graph via plain SVG.
- Do not reproduce or reference Kookmin's copyrighted official campus map image — only its real building numbers (public facts) are used.
- The `notes` field in `campus-graph.json` continues to flag what's still an organizer-confirmed placeholder (currently: inter-building distances) — do not remove that disclaimer, only update it to reflect that the Main Gate's identity is now real (not a placeholder).
- Node ids must stay internally consistent within each locale file; the English and Korean files use the same ids (`main-gate`, `administration-hall`, `international-hall`, `college-of-law`), differing only in `name`/`description`/`notes` text.

---

### Task 1: Real building numbers + Main Gate data

**Files:**
- Modify: `lib/campus-pathfinding.ts:1-7`
- Modify: `data/2026/en/campus-graph.json`
- Modify: `data/2026/kr/campus-graph.json`
- Modify: `__tests__/data/campus-graph.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `CampusNode.number?: number` — consumed by Task 2's SVG rendering (`node.number !== undefined` branch) and by both `campus-graph.json` files (each of the 4 nodes sets a real value: Main Gate 25, Administration Hall 1, International Hall 11, College of Law 4).

- [ ] **Step 1: Update the failing test first**

Replace the full contents of `__tests__/data/campus-graph.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import en from "@/data/2026/en/campus-graph.json";
import kr from "@/data/2026/kr/campus-graph.json";
import { type CampusGraphData, findShortestPath } from "@/lib/campus-pathfinding";

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

  it("includes the three confirmed MOBISEC 2026 conference buildings", () => {
    const nodeIds = graph.nodes.map((node) => node.id);
    expect(nodeIds).toEqual(
      expect.arrayContaining(["administration-hall", "international-hall", "college-of-law"]),
    );
  });

  it("uses Kookmin's real official building number for the Main Gate", () => {
    const mainGate = graph.nodes.find((node) => node.id === "main-gate");
    expect(mainGate?.number).toBe(25);
  });

  it("connects every node to the Main Gate", () => {
    for (const node of graph.nodes) {
      if (node.id === "main-gate") {
        continue;
      }
      const result = findShortestPath(graph, "main-gate", node.id);
      expect(result).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run __tests__/data/campus-graph.test.ts`
Expected: FAIL — both "uses Kookmin's real official building number for the Main Gate" (no `main-gate` node exists yet, so `mainGate` is `undefined`) and "connects every node to the Main Gate" (there's no `main-gate` node, so `findShortestPath` returns `null` for every node) fail.

- [ ] **Step 3: Add the `number` field to `CampusNode`**

In `lib/campus-pathfinding.ts`, replace:

```ts
export interface CampusNode {
  id: string;
  name: string;
  description?: string;
  x: number;
  y: number;
}
```

with:

```ts
export interface CampusNode {
  id: string;
  name: string;
  description?: string;
  number?: number; // Kookmin's official campus-map building number, e.g. 1, 11, 4, 25
  x: number;
  y: number;
}
```

- [ ] **Step 4: Update the English data file**

Replace the full contents of `data/2026/en/campus-graph.json` with:

```json
{
  "notes": "Node x/y are proportioned from the organizing committee's reference satellite screenshot (entrance/parking to the south, building cluster to the north, College of Law to the east) — a real relative layout, not GPS-exact. Distances are still estimated placeholders. Confirm exact inter-building distances with the MOBISEC 2026 organizing committee before launch.",
  "nodes": [
    {
      "id": "main-gate",
      "name": "Main Gate",
      "description": "Main Gate (Security Office)",
      "number": 25,
      "x": 500,
      "y": 850
    },
    {
      "id": "administration-hall",
      "name": "Administration Hall",
      "description": "Main Conference Hall — 1F",
      "number": 1,
      "x": 650,
      "y": 400
    },
    {
      "id": "international-hall",
      "name": "International Hall",
      "description": "Paper Sessions — 5F, rooms 501, 502, 506",
      "number": 11,
      "x": 680,
      "y": 520
    },
    {
      "id": "college-of-law",
      "name": "College of Law",
      "description": "Lunch — 5F",
      "number": 4,
      "x": 800,
      "y": 480
    }
  ],
  "edges": [
    { "from": "main-gate", "to": "administration-hall", "distanceMeters": 300 },
    { "from": "administration-hall", "to": "international-hall", "distanceMeters": 80 },
    { "from": "international-hall", "to": "college-of-law", "distanceMeters": 60 },
    { "from": "administration-hall", "to": "college-of-law", "distanceMeters": 120 }
  ]
}
```

- [ ] **Step 5: Update the Korean data file**

Replace the full contents of `data/2026/kr/campus-graph.json` with:

```json
{
  "notes": "노드 x/y 좌표는 조직위원회가 제공한 위성 사진 참고 자료를 기준으로 비례 배치했습니다(출입구/주차장은 남쪽, 건물군은 북쪽, 법과대학은 동쪽) — 실제 상대적 배치이며 GPS 정밀도는 아닙니다. 거리는 여전히 추정값입니다. 정확한 건물 간 거리를 MOBISEC 2026 조직위원회에 확인 후 반영해야 합니다.",
  "nodes": [
    {
      "id": "main-gate",
      "name": "정문",
      "description": "정문 (경비실)",
      "number": 25,
      "x": 500,
      "y": 850
    },
    {
      "id": "administration-hall",
      "name": "본관",
      "description": "메인 컨퍼런스 홀 — 1층",
      "number": 1,
      "x": 650,
      "y": 400
    },
    {
      "id": "international-hall",
      "name": "국제관",
      "description": "논문 발표 세션 — 5층, 501, 502, 506호",
      "number": 11,
      "x": 680,
      "y": 520
    },
    {
      "id": "college-of-law",
      "name": "법과대학",
      "description": "점심 식사 — 5층",
      "number": 4,
      "x": 800,
      "y": 480
    }
  ],
  "edges": [
    { "from": "main-gate", "to": "administration-hall", "distanceMeters": 300 },
    { "from": "administration-hall", "to": "international-hall", "distanceMeters": 80 },
    { "from": "international-hall", "to": "college-of-law", "distanceMeters": 60 },
    { "from": "administration-hall", "to": "college-of-law", "distanceMeters": 120 }
  ]
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run __tests__/data/campus-graph.test.ts`
Expected: PASS (8 tests — 4 checks × 2 locales)

- [ ] **Step 7: Run the full test suite to check nothing else broke**

Run: `npx vitest run`
Expected: All tests pass. (Task 2, not yet done, will still be using the old `CampusNavigatorClient.tsx` at this point — it doesn't hardcode `"campus-entrance"` anywhere, so it keeps working against the renamed node without changes.)

- [ ] **Step 8: Commit**

```bash
git add lib/campus-pathfinding.ts data/2026/en/campus-graph.json data/2026/kr/campus-graph.json __tests__/data/campus-graph.test.ts
git commit -m "feat: replace placeholder campus entrance with real Main Gate (25) and add official building numbers"
```

---

### Task 2: Visual redesign of the diagram

**Files:**
- Modify: `modules/landing/home/components/CampusNavigatorClient.tsx`
- Modify: `__tests__/components/campus-navigator-client.test.tsx`

**Interfaces:**
- Consumes: `CampusNode.number?: number` from Task 1
- Produces: no new exports — same `CampusNavigatorClient` default export and `{ graph: CampusGraphData }` prop shape as before.

- [ ] **Step 1: Update the test file first (add a `number` to the fixture and a new test)**

Replace the full contents of `__tests__/components/campus-navigator-client.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import type { CampusGraphData } from "@/lib/campus-pathfinding";
import CampusNavigatorClient from "@/modules/landing/home/components/CampusNavigatorClient";

// happy-dom doesn't implement the Pointer Events / scroll APIs that Radix UI's
// Select uses internally; without these no-op polyfills, clicking the trigger
// throws ("target.hasPointerCapture is not a function") and the listbox never opens.
beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

const graph: CampusGraphData = {
  nodes: [
    { id: "a", name: "Point A", number: 25, x: 0, y: 0 },
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

  it("shows the building's official number badge on the diagram", async () => {
    const user = userEvent.setup();
    render(<CampusNavigatorClient graph={graph} />);

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    await user.click(fromSelect);
    await user.click(await screen.findByRole("option", { name: "Point A" }));

    await user.click(toSelect);
    await user.click(await screen.findByRole("option", { name: "Point B" }));

    await user.click(screen.getByRole("button", { name: /findPathButton/i }));

    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("clears the previously computed route when an endpoint selection changes", async () => {
    const user = userEvent.setup();
    render(<CampusNavigatorClient graph={graph} />);

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    await user.click(fromSelect);
    await user.click(await screen.findByRole("option", { name: "Point A" }));

    await user.click(toSelect);
    await user.click(await screen.findByRole("option", { name: "Point B" }));

    await user.click(screen.getByRole("button", { name: /findPathButton/i }));

    expect(screen.getByText("Point A → Point B")).toBeInTheDocument();

    const [, toSelectAfter] = screen.getAllByRole("combobox");
    await user.click(toSelectAfter);
    await user.click(await screen.findByRole("option", { name: "Point C" }));

    expect(screen.queryByText("Point A → Point B")).not.toBeInTheDocument();
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

- [ ] **Step 2: Run the test to verify the new test fails**

Run: `npx vitest run __tests__/components/campus-navigator-client.test.tsx`
Expected: 4 tests PASS, 1 new test ("shows the building's official number badge on the diagram") FAILS — the current component doesn't render `node.number` anywhere, so `screen.getByText("25")` finds nothing.

- [ ] **Step 3: Replace the component's rendering**

Replace the full contents of `modules/landing/home/components/CampusNavigatorClient.tsx` with:

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
import { type CampusGraphData, findShortestPath, type PathResult } from "@/lib/campus-pathfinding";

const WALKING_METERS_PER_MINUTE = 80;
const BUILDING_WIDTH = 90;
const BUILDING_HEIGHT = 60;
const BADGE_RADIUS = 16;
const TREE_OFFSET = 20;
const TREE_COLOR = "#8fae7c";
const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const CampusNavigatorClient = ({ graph }: { graph: CampusGraphData }) => {
  const t = useTranslations("CampusNavigator");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [result, setResult] = useState<PathResult | null | undefined>(undefined);

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );

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
          <Select
            value={fromId}
            onValueChange={(value) => {
              setFromId(value);
              setResult(undefined);
            }}
          >
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
          <Select
            value={toId}
            onValueChange={(value) => {
              setToId(value);
              setResult(undefined);
            }}
          >
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
            className="w-full h-64 sm:h-80 border border-border rounded-lg"
          >
            <rect x={0} y={0} width={1000} height={1000} fill="var(--muted)" />

            {graph.edges.map((edge) => {
              const a = nodeById.get(edge.from);
              const b = nodeById.get(edge.to);
              if (!a || !b) {
                return null;
              }
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const length = Math.sqrt(dx * dx + dy * dy) || 1;
              const perpX = -dy / length;
              const perpY = dx / length;
              const midX = (a.x + b.x) / 2 + perpX * TREE_OFFSET;
              const midY = (a.y + b.y) / 2 + perpY * TREE_OFFSET;
              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="var(--border)"
                    strokeWidth={10}
                    strokeLinecap="round"
                  />
                  <circle cx={midX} cy={midY} r={5} fill={TREE_COLOR} />
                </g>
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

            {graph.nodes.map((node) => {
              const onPath = result.path.includes(node.id);
              return (
                <g key={node.id}>
                  <rect
                    x={node.x - BUILDING_WIDTH / 2}
                    y={node.y - BUILDING_HEIGHT / 2}
                    width={BUILDING_WIDTH}
                    height={BUILDING_HEIGHT}
                    rx={8}
                    fill={onPath ? "var(--primary)" : "var(--card)"}
                    stroke="var(--border)"
                    strokeWidth={2}
                  />
                  {node.number !== undefined && (
                    <>
                      <circle cx={node.x} cy={node.y} r={BADGE_RADIUS} fill="var(--foreground)" />
                      <text
                        x={node.x}
                        y={node.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--background)"
                        fontSize={18}
                        fontWeight="bold"
                      >
                        {node.number}
                      </text>
                    </>
                  )}
                  <text
                    x={node.x}
                    y={node.y - BUILDING_HEIGHT / 2 - 10}
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize={24}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <p className="body text-foreground">
            {result.path.map((id) => nodeById.get(id)?.name ?? id).join(" → ")}
          </p>
          <p className="caption text-muted-foreground">
            {t("totalDistance", { distance: result.totalDistanceMeters })} ·{" "}
            {t("walkingTime", {
              minutes: Math.max(
                1,
                Math.round(result.totalDistanceMeters / WALKING_METERS_PER_MINUTE),
              ),
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
Expected: PASS (5 tests)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add modules/landing/home/components/CampusNavigatorClient.tsx __tests__/components/campus-navigator-client.test.tsx
git commit -m "feat: redesign campus navigator diagram with numbered building badges"
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, then open `http://localhost:3000/2026` in a browser.

- Scroll to the "Campus Navigator" section.
- Select "Main Gate" as From and "International Hall" as To, click "Find Path" — confirm: a soft green/muted background fills the diagram, each location renders as a rounded building shape with a dark numbered badge (Main Gate shows "25", International Hall shows "11"), small green dot decorations appear near the walkway lines, and the route between Main Gate and International Hall is highlighted.
- Confirm the highlighted buildings along the route show the highlight color on their building shape, not just the badge.
- Switch the language toggle to Korean — confirm building names render in Korean while the numbered badges stay the same numbers.
