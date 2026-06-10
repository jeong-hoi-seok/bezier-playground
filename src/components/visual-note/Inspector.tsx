"use client";

import Image from "next/image";
import { NODE_DEFS, type ParamSpec, type ParamValue } from "./nodeDefs";
import { useVisualNoteStore } from "./store";

export function Inspector() {
	const selectedId = useVisualNoteStore((s) => s.selectedId);
	const node = useVisualNoteStore(
		(s) => s.nodes.find((n) => n.id === selectedId) ?? null,
	);
	const updateNodeParam = useVisualNoteStore((s) => s.updateNodeParam);

	return (
		<aside className="w-64 bg-zinc-950 border-l border-zinc-800 flex flex-col p-4 gap-4 shrink-0 overflow-y-auto">
			<p className="text-zinc-500 text-xs uppercase tracking-widest">
				Inspector
			</p>

			{!node && (
				<p className="text-zinc-600 text-sm">
					노드를 선택하면 설정값이 표시됩니다.
				</p>
			)}

			{node && (
				<>
					<div className="flex items-center gap-2">
						{NODE_DEFS[node.kind].image ? (
							<Image
								src={NODE_DEFS[node.kind].image as string}
								alt=""
								width={28}
								height={28}
								className="object-contain shrink-0"
								draggable={false}
							/>
						) : (
							<span className="text-xl leading-none">
								{NODE_DEFS[node.kind].icon}
							</span>
						)}
						<div className="flex flex-col">
							<span className="text-zinc-200 text-sm font-medium">
								{node.label}
							</span>
							<span className="text-zinc-500 text-xs">
								{NODE_DEFS[node.kind].label}
							</span>
						</div>
					</div>

					{NODE_DEFS[node.kind].params.length === 0 && (
						<p className="text-zinc-600 text-sm">설정값이 없는 노드입니다.</p>
					)}

					<div className="flex flex-col gap-4">
						{NODE_DEFS[node.kind].params.map((spec) => (
							<ParamField
								key={spec.key}
								spec={spec}
								value={node.params[spec.key] ?? spec.default}
								onChange={(value) => updateNodeParam(node.id, spec.key, value)}
							/>
						))}
					</div>
				</>
			)}
		</aside>
	);
}

interface ParamFieldProps {
	spec: ParamSpec;
	value: ParamValue;
	onChange: (value: ParamValue) => void;
}

function ParamField({ spec, value, onChange }: ParamFieldProps) {
	const fieldId = `param-${spec.key}`;

	if (spec.control === "select") {
		return (
			<div className="flex flex-col gap-1.5">
				<label htmlFor={fieldId} className="text-zinc-400 text-xs">
					{spec.label}
				</label>
				<select
					id={fieldId}
					className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-500"
					value={String(value)}
					onChange={(e) => onChange(e.target.value)}
				>
					{spec.options?.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
		);
	}

	if (spec.control === "color") {
		return (
			<div className="flex flex-col gap-1.5">
				<label htmlFor={fieldId} className="text-zinc-400 text-xs">
					{spec.label}
				</label>
				<div className="flex items-center gap-2">
					<input
						id={fieldId}
						type="color"
						className="h-8 w-12 bg-transparent rounded cursor-pointer"
						value={String(value)}
						onChange={(e) => onChange(e.target.value)}
					/>
					<span className="text-zinc-400 text-xs tabular-nums">
						{String(value)}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<label htmlFor={fieldId} className="text-zinc-400 text-xs">
					{spec.label}
				</label>
				<span className="text-zinc-300 text-xs tabular-nums">
					{Number(value)}
				</span>
			</div>
			<input
				id={fieldId}
				type="range"
				className="w-full accent-zinc-400 cursor-pointer"
				min={spec.min}
				max={spec.max}
				step={spec.step}
				value={Number(value)}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</div>
	);
}
