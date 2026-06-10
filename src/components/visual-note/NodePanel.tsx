"use client";

import Image from "next/image";
import {
	CATEGORY_LABELS,
	CATEGORY_ORDER,
	NODE_DEFS,
	type NodeDef,
	type NodeKind,
} from "./nodeDefs";
import { useVisualNoteStore } from "./store";

const DEFS_BY_CATEGORY = CATEGORY_ORDER.map((category) => ({
	category,
	defs: Object.values(NODE_DEFS).filter((def) => def.category === category),
}));

export function NodePanel() {
	const addNode = useVisualNoteStore((s) => s.addNode);
	const nodeCount = useVisualNoteStore((s) => s.nodes.length);

	const handleAdd = (kind: NodeKind) => {
		const stagger = (nodeCount % 8) * 28;
		addNode(360 + stagger, 240 + stagger, kind);
	};

	return (
		<aside className="w-48 bg-zinc-950 border-r border-zinc-800 flex flex-col p-3 gap-4 shrink-0 overflow-y-auto">
			{DEFS_BY_CATEGORY.map(({ category, defs }) => (
				<section key={category} className="flex flex-col gap-2">
					<p className="text-zinc-500 text-xs uppercase tracking-widest">
						{CATEGORY_LABELS[category]}
					</p>
					{defs.map((def) => (
						<NodeButton
							key={def.kind}
							def={def}
							onClick={() => handleAdd(def.kind)}
						/>
					))}
				</section>
			))}
		</aside>
	);
}

interface NodeButtonProps {
	def: NodeDef;
	onClick: () => void;
}

function NodeButton({ def, onClick }: NodeButtonProps) {
	return (
		<button
			type="button"
			aria-label={`${def.label} 노드 추가`}
			className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors hover:brightness-125"
			style={{
				backgroundColor: def.bg,
				borderColor: def.border,
				color: def.text,
				borderWidth: 1,
			}}
			onClick={onClick}
		>
			{def.image ? (
				<Image
					src={def.image}
					alt=""
					width={20}
					height={20}
					className="object-contain shrink-0"
					draggable={false}
				/>
			) : (
				<span className="text-base leading-none">{def.icon}</span>
			)}
			{def.label}
		</button>
	);
}
