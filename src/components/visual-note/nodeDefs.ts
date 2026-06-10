export type NodeKind = "character" | "run" | "jump" | "grass" | "output";

export type NodeCategory = "character" | "action" | "elemental" | "output";

export type ParamValue = number | string;

export interface ParamSpec {
	key: string;
	label: string;
	control: "number" | "select" | "color";
	default: ParamValue;
	min?: number;
	max?: number;
	step?: number;
	options?: { value: string; label: string }[];
}

export interface NodeDef {
	kind: NodeKind;
	category: NodeCategory;
	label: string;
	icon: string;
	image?: string;
	bg: string;
	border: string;
	text: string;
	params: ParamSpec[];
}

const CHARACTER_PARAMS: ParamSpec[] = [
	{
		key: "size",
		label: "크기",
		control: "number",
		default: 1,
		min: 0.5,
		max: 2,
		step: 0.1,
	},
];

const actionParams = (): ParamSpec[] => [
	{
		key: "speed",
		label: "속도",
		control: "number",
		default: 5,
		min: 1,
		max: 10,
		step: 1,
	},
	{
		key: "repeat",
		label: "반복 횟수",
		control: "number",
		default: 2,
		min: 1,
		max: 5,
		step: 1,
	},
];

const elementalParams = (tint: string): ParamSpec[] => [
	{
		key: "intensity",
		label: "강도",
		control: "number",
		default: 50,
		min: 0,
		max: 100,
		step: 1,
	},
	{ key: "tint", label: "색조", control: "color", default: tint },
];

export const NODE_DEFS: Record<NodeKind, NodeDef> = {
	character: {
		kind: "character",
		category: "character",
		label: "도로롱",
		icon: "🐹",
		image: "/dororong.png",
		bg: "#2e1065",
		border: "#7c3aed",
		text: "#ede9fe",
		params: CHARACTER_PARAMS,
	},
	run: {
		kind: "run",
		category: "action",
		label: "달리기",
		icon: "🏃",
		bg: "#451a03",
		border: "#d97706",
		text: "#fef3c7",
		params: actionParams(),
	},
	jump: {
		kind: "jump",
		category: "action",
		label: "뛰기",
		icon: "⬆️",
		bg: "#451a03",
		border: "#d97706",
		text: "#fef3c7",
		params: actionParams(),
	},
	grass: {
		kind: "grass",
		category: "elemental",
		label: "풀",
		icon: "🌿",
		bg: "#052e16",
		border: "#22c55e",
		text: "#dcfce7",
		params: elementalParams("#4ade80"),
	},
	output: {
		kind: "output",
		category: "output",
		label: "출력",
		icon: "▶",
		bg: "#1c1917",
		border: "#78716c",
		text: "#d6d3d1",
		params: [],
	},
};

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
	character: "캐릭터",
	action: "행동",
	elemental: "엘리멘탈",
	output: "출력",
};

export const CATEGORY_ORDER: NodeCategory[] = [
	"character",
	"action",
	"elemental",
	"output",
];

export const hasOutputPort = (kind: NodeKind): boolean => kind !== "output";

export const defaultParams = (kind: NodeKind): Record<string, ParamValue> => {
	const params: Record<string, ParamValue> = {};
	for (const spec of NODE_DEFS[kind].params) {
		params[spec.key] = spec.default;
	}
	return params;
};
