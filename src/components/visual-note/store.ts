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

export type LogLevel = "info" | "warn" | "success";

export interface LogEntry {
  id: number;
  ts: number;
  level: LogLevel;
  message: string;
}

interface VisualNoteStore {
  nodes: NoteNode[];
  zoom: number;
  offset: { x: number; y: number };
  logs: LogEntry[];
  addNode: (x: number, y: number) => void;
  moveNode: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
}

let idCounter = 0;
let logCounter = 0;
let lastZoomLog = 0;

function mkLog(level: LogLevel, message: string): LogEntry {
  return { id: ++logCounter, ts: Date.now(), level, message };
}

export const useVisualNoteStore = create<VisualNoteStore>((set) => ({
  nodes: [],
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
        logs: [...s.logs, mkLog("warn", `[node:removed] id=${id} label="${node?.label}"`)],
      };
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
