"use client";

import { useVisualNoteStore } from "./store";

export function NodePanel() {
  const { addNode } = useVisualNoteStore();

  return (
    <aside className="w-48 bg-zinc-950 border-r border-zinc-800 flex flex-col p-3 gap-2 shrink-0">
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Nodes</p>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm text-left transition-colors"
        onClick={() => addNode(300, 300)}
      >
        <span className="text-zinc-400">☐</span>
        Text Note
      </button>
    </aside>
  );
}
