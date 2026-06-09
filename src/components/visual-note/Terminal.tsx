"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVisualNoteStore } from "./store";

const DEFAULT_HEIGHT = 200;
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 600;

function timestamp(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function Terminal() {
  const logs = useVisualNoteStore((s) => s.logs);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [collapsed, setCollapsed] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const prevLogCount = useRef(0);

  // auto-scroll on new log
  useEffect(() => {
    if (logs.length !== prevLogCount.current && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      prevLogCount.current = logs.length;
    }
  }, [logs]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = height;

    const onMove = (ev: MouseEvent) => {
      const dy = dragStartY.current - ev.clientY;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartH.current + dy)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [height]);

  return (
    <div
      className="flex flex-col bg-zinc-950 border-t border-zinc-800 shrink-0"
      style={{ height: collapsed ? 32 : height }}
    >
      {/* resize handle */}
      {!collapsed && (
        <div
          className="h-1 w-full cursor-ns-resize hover:bg-zinc-600 transition-colors shrink-0"
          onMouseDown={onResizeMouseDown}
        />
      )}

      {/* header */}
      <div className="flex items-center gap-2 px-3 h-8 shrink-0 border-b border-zinc-800">
        <span className="text-zinc-400 text-xs font-mono uppercase tracking-widest">Terminal</span>
        <span className="text-zinc-600 text-xs font-mono ml-1">{logs.length} lines</span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
            onClick={() => useVisualNoteStore.setState({ logs: [] })}
          >
            clear
          </button>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* log body */}
      {!collapsed && (
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto font-mono text-xs px-3 py-2 space-y-0.5"
        >
          {logs.length === 0 && (
            <span className="text-zinc-600">대기 중 — 노드를 추가하거나 캔버스를 조작하세요.</span>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 leading-5">
              <span className="text-zinc-600 shrink-0">{timestamp(log.ts)}</span>
              <span
                className={
                  log.level === "success"
                    ? "text-emerald-400"
                    : log.level === "warn"
                      ? "text-amber-400"
                      : "text-zinc-300"
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
