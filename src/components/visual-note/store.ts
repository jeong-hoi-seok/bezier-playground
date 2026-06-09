"use client";

import { create } from "zustand";

export type NodeType = "text";

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
  addNode: (x: number, y: number) => void;
  moveNode: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  removeEdge: (id: string) => void;
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

  addNode: (x, y) =>
    set((s) => {
      const id = `node-${++idCounter}`;
      const label = `Note ${idCounter}`;
      return {
        nodes: [...s.nodes, { id, type: "text", x, y, label }],
        logs: [...s.logs, mkLog("success", `[node:added] id=${id} label="${label}" x=${Math.round(x)} y=${Math.round(y)}`)],
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
