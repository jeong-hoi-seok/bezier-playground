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

interface VisualNoteStore {
  nodes: NoteNode[];
  zoom: number;
  offset: { x: number; y: number };
  addNode: (x: number, y: number) => void;
  moveNode: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
}

let idCounter = 0;

export const useVisualNoteStore = create<VisualNoteStore>((set) => ({
  nodes: [],
  zoom: 1,
  offset: { x: 0, y: 0 },
  addNode: (x, y) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: `node-${++idCounter}`,
          type: "text",
          x,
          y,
          label: `Note ${idCounter}`,
        },
      ],
    })),
  moveNode: (id, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    })),
  removeNode: (id) =>
    set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),
  setZoom: (zoom) => set({ zoom }),
  setOffset: (x, y) => set({ offset: { x, y } }),
}));
