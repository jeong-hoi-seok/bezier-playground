"use client";

import type { NoteNode } from "./store";

interface Props {
  node: NoteNode;
  isInputHovered: boolean;
  onMoveStart: (e: React.MouseEvent, id: string, nx: number, ny: number) => void;
  onOutputPortDown: (e: React.MouseEvent, nodeId: string) => void;
  onInputPortUp: (e: React.MouseEvent, nodeId: string) => void;
  onInputPortEnter: (nodeId: string) => void;
  onInputPortLeave: () => void;
  onDeleteRequest: (id: string) => void;
}

export function NoteNodeCard({
  node,
  isInputHovered,
  onMoveStart,
  onOutputPortDown,
  onInputPortUp,
  onInputPortEnter,
  onInputPortLeave,
  onDeleteRequest,
}: Props) {
  return (
    <div
      data-node="true"
      className="absolute group"
      style={{
        left: node.x,
        top: node.y,
        transform: "translate(-50%, -50%)",
        width: 160,
      }}
      onMouseDown={(e) => onMoveStart(e, node.id, node.x, node.y)}
    >
      {/* input port — left, orange */}
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => onInputPortUp(e, node.id)}
        onMouseEnter={() => onInputPortEnter(node.id)}
        onMouseLeave={onInputPortLeave}
      >
        <div
          className="w-3 h-3 rounded-full border-2 transition-colors cursor-crosshair"
          style={{
            backgroundColor: isInputHovered ? "#ffffff" : "#3f3f46",
            borderColor: "#ffffff",
          }}
        />
      </div>

      {/* card body */}
      <div className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-100 text-sm shadow-lg cursor-grab active:cursor-grabbing">
        <div className="flex items-center justify-between gap-3">
          <span>{node.label}</span>
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity leading-none shrink-0"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(node.id); }}
          >
            ×
          </button>
        </div>
      </div>

      {/* output port — right, white */}
      <div
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10"
        onMouseDown={(e) => { e.stopPropagation(); onOutputPortDown(e, node.id); }}
      >
        <div className="w-3 h-3 rounded-full bg-white border-2 border-zinc-400 hover:border-white hover:scale-125 transition-all cursor-crosshair" />
      </div>
    </div>
  );
}
