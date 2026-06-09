"use client";

import { create } from "zustand";

export type NodeType = "text" | "output";

export interface NoteNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export type LogLevel = "info" | "warn" | "success";

export interface LogEntry {
  id: number;
  ts: number;
  level: LogLevel;
  message: string;
}

interface VisualNoteStore {
  nodes: NoteNode[];
  edges: Edge[];
  zoom: number;
  offset: { x: number; y: number };
  logs: LogEntry[];
  addNode: (x: number, y: number, type?: NodeType) => void;
  moveNode: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  removeEdge: (id: string) => void;
  runGraph: () => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
}

let idCounter = 0;
let edgeCounter = 0;
let logCounter = 0;
let lastZoomLog = 0;

function mkLog(level: LogLevel, message: string): LogEntry {
  return { id: ++logCounter, ts: Date.now(), level, message };
}

export const useVisualNoteStore = create<VisualNoteStore>((set) => ({
  nodes: [],
  edges: [],
  zoom: 1,
  offset: { x: 0, y: 0 },
  logs: [],

  addNode: (x, y, type = "text") =>
    set((s) => {
      const id = `node-${++idCounter}`;
      const label = type === "output" ? `Output ${idCounter}` : `Note ${idCounter}`;
      return {
        nodes: [...s.nodes, { id, type, x, y, label }],
        logs: [...s.logs, mkLog("success", `[node:added] id=${id} type=${type} label="${label}" x=${Math.round(x)} y=${Math.round(y)}`)],
      };
    }),

  moveNode: (id, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    })),

  removeNode: (id) =>
    set((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return {
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
        logs: [...s.logs, mkLog("warn", `[node:removed] id=${id} label="${node?.label}"`)],
      };
    }),

  addEdge: (sourceId, targetId) =>
    set((s) => {
      const duplicate = s.edges.some(
        (e) => e.sourceId === sourceId && e.targetId === targetId,
      );
      if (duplicate || sourceId === targetId) return s;
      const id = `edge-${++edgeCounter}`;
      return {
        edges: [...s.edges, { id, sourceId, targetId }],
        logs: [...s.logs, mkLog("success", `[edge:connected] ${sourceId} → ${targetId}`)],
      };
    }),

  removeEdge: (id) =>
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== id),
      logs: [...s.logs, mkLog("warn", `[edge:removed] id=${id}`)],
    })),

  runGraph: () =>
    set((s) => {
      const newLogs: LogEntry[] = [mkLog("info", "[run:start] ── 실행 시작 ──")];

      const outputNodes = s.nodes.filter((n) => n.type === "output");
      if (outputNodes.length === 0) {
        newLogs.push(mkLog("warn", "[run:error] 출력 노드가 없습니다. Output 노드를 추가하세요."));
        return { logs: [...s.logs, ...newLogs] };
      }

      for (const outNode of outputNodes) {
        // BFS backwards from output node to collect ordered chain
        const chain: string[] = [];
        const visited = new Set<string>();
        const queue: string[] = [outNode.id];

        while (queue.length > 0) {
          const cur = queue.shift()!;
          if (visited.has(cur)) continue;
          visited.add(cur);
          const incoming = s.edges.filter((e) => e.targetId === cur);
          for (const edge of incoming) {
            chain.unshift(edge.sourceId);
            queue.push(edge.sourceId);
          }
        }

        if (chain.length === 0) {
          newLogs.push(mkLog("warn", `[run:warn] "${outNode.label}" — 연결된 노드 없음`));
          continue;
        }

        const labels = chain
          .map((id) => s.nodes.find((n) => n.id === id)?.label ?? id)
          .join(" → ");
        newLogs.push(mkLog("success", `[run:output] ${labels} → ${outNode.label}`));
      }

      newLogs.push(mkLog("info", "[run:end] ── 실행 완료 ──"));
      return { logs: [...s.logs, ...newLogs] };
    }),

  setZoom: (zoom) =>
    set((s) => {
      const now = Date.now();
      const shouldLog = now - lastZoomLog > 300;
      if (shouldLog) lastZoomLog = now;
      return {
        zoom,
        logs: shouldLog
          ? [...s.logs, mkLog("info", `[canvas:zoom] ${Math.round(zoom * 100)}%`)]
          : s.logs,
      };
    }),

  setOffset: (x, y) => set({ offset: { x, y } }),
}));
