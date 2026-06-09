"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { NoteNodeCard } from "./NoteNodeCard";
import { useVisualNoteStore } from "./store";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_SENSITIVITY = 0.001;
const NODE_HALF_W = 80;

interface PendingEdge {
  sourceId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const cx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + cx} ${y1}, ${x2 - cx} ${y2}, ${x2} ${y2}`;
}

export function Canvas() {
  const { nodes, edges, zoom, offset, moveNode, removeNode, addEdge, setZoom, setOffset } =
    useVisualNoteStore();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null);
  const [hoveredInputId, setHoveredInputId] = useState<string | null>(null);
  const [spaceActive, setSpaceActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const isSpaceDown = useRef(false);
  const isDraggingEdge = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const draggingNode = useRef<string | null>(null);
  const dragNodeStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });

  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (sx - rect.left - offsetRef.current.x) / zoomRef.current,
      y: (sy - rect.top - offsetRef.current.y) / zoomRef.current,
    };
  }, []);

  // spacebar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        isSpaceDown.current = true;
        setSpaceActive(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpaceDown.current = false;
        setSpaceActive(false);
        isPanning.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // non-passive wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const z = zoomRef.current;
      const o = offsetRef.current;
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta * z));
      const scale = nextZoom / z;
      setZoom(nextZoom);
      setOffset(mouseX - scale * (mouseX - o.x), mouseY - scale * (mouseY - o.y));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setZoom, setOffset]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && isSpaceDown.current)) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...offset };
        e.preventDefault();
      }
    },
    [offset],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setOffset(offsetStart.current.x + dx, offsetStart.current.y + dy);
        return;
      }
      if (isDraggingEdge.current) {
        const c = screenToCanvas(e.clientX, e.clientY);
        setPendingEdge((prev) => prev ? { ...prev, x2: c.x, y2: c.y } : null);
        return;
      }
      if (draggingNode.current) {
        const dx = e.clientX - dragNodeStart.current.mx;
        const dy = e.clientY - dragNodeStart.current.my;
        moveNode(
          draggingNode.current,
          dragNodeStart.current.nx + dx / zoom,
          dragNodeStart.current.ny + dy / zoom,
        );
      }
    },
    [zoom, setOffset, moveNode, screenToCanvas],
  );

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
    draggingNode.current = null;
    if (isDraggingEdge.current) {
      isDraggingEdge.current = false;
      setPendingEdge(null);
      setHoveredInputId(null);
    }
  }, []);

  const onNodeMoveStart = useCallback(
    (e: React.MouseEvent, id: string, nx: number, ny: number) => {
      if (isSpaceDown.current || isDraggingEdge.current) return;
      e.stopPropagation();
      draggingNode.current = id;
      dragNodeStart.current = { mx: e.clientX, my: e.clientY, nx, ny };
    },
    [],
  );

  const onOutputPortDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const node = useVisualNoteStore.getState().nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const x1 = node.x + NODE_HALF_W;
      const y1 = node.y;
      const c = screenToCanvas(e.clientX, e.clientY);
      isDraggingEdge.current = true;
      setPendingEdge({ sourceId: nodeId, x1, y1, x2: c.x, y2: c.y });
    },
    [screenToCanvas],
  );

  const onInputPortUp = useCallback(
    (_e: React.MouseEvent, nodeId: string) => {
      if (!isDraggingEdge.current || !pendingEdge) return;
      addEdge(pendingEdge.sourceId, nodeId);
      isDraggingEdge.current = false;
      setPendingEdge(null);
      setHoveredInputId(null);
    },
    [pendingEdge, addEdge],
  );

  const gridSize = 40 * zoom;
  const gridOffsetX = offset.x % gridSize;
  const gridOffsetY = offset.y % gridSize;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-zinc-900 select-none"
      style={{
        overscrollBehavior: "none",
        touchAction: "none",
        cursor: spaceActive ? (isPanning.current ? "grabbing" : "grab") : "default",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* grid lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.35 }}
      >
        <defs>
          <pattern
            id="grid"
            x={gridOffsetX}
            y={gridOffsetY}
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="#52525b"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* canvas layer */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        {/* edges */}
        <svg
          overflow="visible"
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, width: 1, height: 1 }}
        >
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.sourceId);
            const tgt = nodes.find((n) => n.id === edge.targetId);
            if (!src || !tgt) return null;
            return (
              <path
                key={edge.id}
                d={edgePath(src.x + NODE_HALF_W, src.y, tgt.x - NODE_HALF_W, tgt.y)}
                fill="none"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            );
          })}

          {/* pending edge while dragging */}
          {pendingEdge && (
            <path
              d={edgePath(pendingEdge.x1, pendingEdge.y1, pendingEdge.x2, pendingEdge.y2)}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          )}
        </svg>

        {/* nodes */}
        {nodes.map((node) => (
          <NoteNodeCard
            key={node.id}
            node={node}
            isInputHovered={hoveredInputId === node.id}
            onMoveStart={onNodeMoveStart}
            onOutputPortDown={onOutputPortDown}
            onInputPortUp={onInputPortUp}
            onInputPortEnter={(id) => isDraggingEdge.current && setHoveredInputId(id)}
            onInputPortLeave={() => setHoveredInputId(null)}
            onDeleteRequest={setPendingDeleteId}
          />
        ))}
      </div>

      {/* zoom indicator */}
      <div className="absolute bottom-4 right-4 text-zinc-500 text-xs tabular-nums pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-zinc-600 text-sm">스크롤 줌 · Space+드래그 패닝</p>
        </div>
      )}

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>노드 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 노드를 삭제할까요? 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (pendingDeleteId) removeNode(pendingDeleteId); setPendingDeleteId(null); }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
