"use client";

import { useVisualNoteStore } from "./store";

export function Header() {
	const runGraph = useVisualNoteStore((s) => s.runGraph);
	const nodes = useVisualNoteStore((s) => s.nodes);

	const hasOutput = nodes.some((n) => n.kind === "output");

	return (
		<header className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 gap-4 shrink-0">
			<span className="text-zinc-400 text-sm font-medium tracking-wide">
				Visual Note
			</span>
			<div className="flex-1" />
			<button
				type="button"
				onClick={runGraph}
				className="flex items-center gap-1.5 px-3 h-6 rounded text-xs font-medium transition-colors"
				style={{
					backgroundColor: hasOutput ? "#16a34a" : "#3f3f46",
					color: hasOutput ? "#ffffff" : "#71717a",
					cursor: hasOutput ? "pointer" : "not-allowed",
				}}
			>
				▶ Run
			</button>
		</header>
	);
}
