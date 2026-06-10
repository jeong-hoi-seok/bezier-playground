"use client";

import Image from "next/image";
import { hasOutputPort, NODE_DEFS } from "./nodeDefs";
import type { NoteNode } from "./store";
import { useVisualNoteStore } from "./store";

interface Props {
	node: NoteNode;
	isInputHovered: boolean;
	onMoveStart: (
		e: React.MouseEvent,
		id: string,
		nx: number,
		ny: number,
	) => void;
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
	const def = NODE_DEFS[node.kind];
	const showOutputPort = hasOutputPort(node.kind);
	const isSelected = useVisualNoteStore((s) => s.selectedId === node.id);
	const selectNode = useVisualNoteStore((s) => s.selectNode);

	const handleMoveStart = (e: React.MouseEvent) => {
		selectNode(node.id);
		onMoveStart(e, node.id, node.x, node.y);
	};

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
			onMouseDown={handleMoveStart}
		>
			{/* input port — left */}
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
			<div
				className="border rounded-lg px-3 py-2 text-sm shadow-lg cursor-grab active:cursor-grabbing transition-shadow"
				style={{
					backgroundColor: def.bg,
					borderColor: isSelected ? "#ffffff" : def.border,
					color: def.text,
					boxShadow: isSelected ? `0 0 0 2px ${def.border}` : undefined,
				}}
			>
				<div className="flex items-center gap-2">
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
						<span className="text-base leading-none shrink-0">{def.icon}</span>
					)}
					<span className="flex-1 truncate">{node.label}</span>
					<button
						type="button"
						aria-label="노드 삭제"
						className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 transition-opacity leading-none shrink-0"
						onMouseDown={(e) => e.stopPropagation()}
						onClick={(e) => {
							e.stopPropagation();
							onDeleteRequest(node.id);
						}}
					>
						×
					</button>
				</div>
			</div>

			{/* output port — right */}
			{showOutputPort && (
				<div
					className="absolute -right-2 top-1/2 -translate-y-1/2 z-10"
					onMouseDown={(e) => {
						e.stopPropagation();
						onOutputPortDown(e, node.id);
					}}
				>
					<div className="w-3 h-3 rounded-full bg-white border-2 border-zinc-400 hover:border-white hover:scale-125 transition-all cursor-crosshair" />
				</div>
			)}
		</div>
	);
}
