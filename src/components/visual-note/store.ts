"use client";

import { create } from "zustand";
import {
	defaultParams,
	NODE_DEFS,
	type NodeKind,
	type ParamValue,
} from "./nodeDefs";

export interface NoteNode {
	id: string;
	kind: NodeKind;
	x: number;
	y: number;
	label: string;
	params: Record<string, ParamValue>;
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

export interface SceneMotion {
	kind: "run" | "jump";
	speed: number;
	repeat: number;
}

export interface SceneEffect {
	kind: "grass";
	intensity: number;
	tint: string;
}

export interface ScenePerformer {
	id: string;
	image: string;
	size: number;
	motions: SceneMotion[];
	effects: SceneEffect[];
}

export interface PreviewState {
	open: boolean;
	performers: ScenePerformer[];
}

interface VisualNoteStore {
	nodes: NoteNode[];
	edges: Edge[];
	zoom: number;
	offset: { x: number; y: number };
	logs: LogEntry[];
	selectedId: string | null;
	preview: PreviewState;
	addNode: (x: number, y: number, kind?: NodeKind) => void;
	moveNode: (id: string, x: number, y: number) => void;
	removeNode: (id: string) => void;
	selectNode: (id: string | null) => void;
	updateNodeParam: (id: string, key: string, value: ParamValue) => void;
	addEdge: (sourceId: string, targetId: string) => void;
	removeEdge: (id: string) => void;
	runGraph: () => void;
	closePreview: () => void;
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

function num(value: ParamValue | undefined, fallback: number): number {
	const n = typeof value === "string" ? Number.parseFloat(value) : value;
	return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(value: ParamValue | undefined, fallback: string): string {
	return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const useVisualNoteStore = create<VisualNoteStore>((set) => ({
	nodes: [],
	edges: [],
	zoom: 1,
	offset: { x: 0, y: 0 },
	logs: [],
	selectedId: null,
	preview: { open: false, performers: [] },

	addNode: (x, y, kind = "character") =>
		set((s) => {
			const id = `node-${++idCounter}`;
			const label = `${NODE_DEFS[kind].label} ${idCounter}`;
			return {
				nodes: [
					...s.nodes,
					{ id, kind, x, y, label, params: defaultParams(kind) },
				],
				logs: [
					...s.logs,
					mkLog(
						"success",
						`[node:added] id=${id} kind=${kind} label="${label}" x=${Math.round(x)} y=${Math.round(y)}`,
					),
				],
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
				selectedId: s.selectedId === id ? null : s.selectedId,
				logs: [
					...s.logs,
					mkLog("warn", `[node:removed] id=${id} label="${node?.label}"`),
				],
			};
		}),

	selectNode: (id) => set({ selectedId: id }),

	updateNodeParam: (id, key, value) =>
		set((s) => ({
			nodes: s.nodes.map((n) =>
				n.id === id ? { ...n, params: { ...n.params, [key]: value } } : n,
			),
		})),

	addEdge: (sourceId, targetId) =>
		set((s) => {
			const duplicate = s.edges.some(
				(e) => e.sourceId === sourceId && e.targetId === targetId,
			);
			if (duplicate || sourceId === targetId) return s;
			const id = `edge-${++edgeCounter}`;
			return {
				edges: [...s.edges, { id, sourceId, targetId }],
				logs: [
					...s.logs,
					mkLog("success", `[edge:connected] ${sourceId} → ${targetId}`),
				],
			};
		}),

	removeEdge: (id) =>
		set((s) => ({
			edges: s.edges.filter((e) => e.id !== id),
			logs: [...s.logs, mkLog("warn", `[edge:removed] id=${id}`)],
		})),

	runGraph: () =>
		set((s) => {
			const newLogs: LogEntry[] = [
				mkLog("info", "[run:start] ── 실행 시작 ──"),
			];

			const outputNodes = s.nodes.filter((n) => n.kind === "output");
			if (outputNodes.length === 0) {
				newLogs.push(
					mkLog(
						"warn",
						"[run:error] 출력 노드가 없습니다. 출력 노드를 추가하세요.",
					),
				);
				return { logs: [...s.logs, ...newLogs] };
			}

			const performers: ScenePerformer[] = [];

			for (const outNode of outputNodes) {
				// BFS backwards from output node to collect connected nodes
				const visited = new Set<string>();
				const queue: string[] = [outNode.id];
				const connected: string[] = [];

				while (queue.length > 0) {
					const cur = queue.shift();
					if (!cur || visited.has(cur)) continue;
					visited.add(cur);
					if (cur !== outNode.id) connected.push(cur);
					const incoming = s.edges.filter((e) => e.targetId === cur);
					for (const edge of incoming) queue.push(edge.sourceId);
				}

				if (connected.length === 0) {
					newLogs.push(
						mkLog("warn", `[run:warn] "${outNode.label}" — 연결된 노드 없음`),
					);
					continue;
				}

				const connectedNodes = connected
					.map((id) => s.nodes.find((n) => n.id === id))
					.filter((n): n is NoteNode => Boolean(n));

				const characters = connectedNodes.filter((n) => n.kind === "character");
				const motions: SceneMotion[] = connectedNodes
					.filter((n) => n.kind === "run" || n.kind === "jump")
					.map((n) => ({
						kind: n.kind as "run" | "jump",
						speed: num(n.params.speed, 5),
						repeat: num(n.params.repeat, 2),
					}));
				const effectsByKind = new Map<SceneEffect["kind"], SceneEffect>();
				for (const n of connectedNodes) {
					if (n.kind !== "grass") continue;
					const effect: SceneEffect = {
						kind: n.kind,
						intensity: num(n.params.intensity, 50),
						tint: str(n.params.tint, "#ffffff"),
					};
					const existing = effectsByKind.get(effect.kind);
					if (!existing || effect.intensity > existing.intensity) {
						effectsByKind.set(effect.kind, effect);
					}
				}
				const effects: SceneEffect[] = [...effectsByKind.values()];

				if (characters.length === 0) {
					newLogs.push(
						mkLog("warn", `[run:warn] "${outNode.label}" — 캐릭터 노드 없음`),
					);
					continue;
				}

				for (const character of characters) {
					performers.push({
						id: `${outNode.id}:${character.id}`,
						image: NODE_DEFS[character.kind].image ?? "",
						size: num(character.params.size, 1),
						motions,
						effects,
					});
				}

				const motionLabels =
					motions.map((m) => NODE_DEFS[m.kind].label).join(", ") || "대기";
				const effectLabels =
					effects.map((e) => NODE_DEFS[e.kind].label).join(", ") || "없음";
				newLogs.push(
					mkLog(
						"success",
						`[run:output] ${outNode.label} ← 캐릭터 ${characters.length} · 행동(${motionLabels}) · 엘리멘탈(${effectLabels})`,
					),
				);
			}

			newLogs.push(mkLog("info", "[run:end] ── 실행 완료 ──"));

			if (performers.length === 0) {
				return { logs: [...s.logs, ...newLogs] };
			}

			return {
				logs: [...s.logs, ...newLogs],
				preview: { open: true, performers },
			};
		}),

	closePreview: () => set((s) => ({ preview: { ...s.preview, open: false } })),

	setZoom: (zoom) =>
		set((s) => {
			const now = Date.now();
			const shouldLog = now - lastZoomLog > 300;
			if (shouldLog) lastZoomLog = now;
			return {
				zoom,
				logs: shouldLog
					? [
							...s.logs,
							mkLog("info", `[canvas:zoom] ${Math.round(zoom * 100)}%`),
						]
					: s.logs,
			};
		}),

	setOffset: (x, y) => set({ offset: { x, y } }),
}));
