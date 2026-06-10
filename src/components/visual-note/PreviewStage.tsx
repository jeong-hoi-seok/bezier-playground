"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { NODE_DEFS } from "./nodeDefs";
import { type ScenePerformer, useVisualNoteStore } from "./store";

const PERFORMER_WIDTH = 64;
const JUMP_HEIGHT = 90;

function computeOffset(
	t: number,
	performer: ScenePerformer,
	travelWidth: number,
): { x: number; y: number } {
	const runMotions = performer.motions.filter((m) => m.kind === "run");
	const jumpMotions = performer.motions.filter((m) => m.kind === "jump");

	let x = 0;
	if (runMotions.length > 0) {
		const speed = Math.max(...runMotions.map((m) => m.speed));
		const travel = Math.max(travelWidth, 0);
		x = (Math.sin(t * speed * 0.45) * 0.5 + 0.5) * travel;
	}

	let y = 0;
	if (jumpMotions.length > 0) {
		const speed = Math.max(...jumpMotions.map((m) => m.speed));
		y = -Math.abs(Math.sin(t * speed * 0.6)) * JUMP_HEIGHT;
	} else if (runMotions.length === 0) {
		// idle bob when there is no motion
		y = Math.sin(t * 2) * 4;
	}

	return { x, y };
}

function glowStyle(performer: ScenePerformer): React.CSSProperties {
	if (performer.effects.length === 0) return {};
	const strongest = performer.effects.reduce((a, b) =>
		a.intensity >= b.intensity ? a : b,
	);
	const opacity = Math.min(0.9, 0.15 + (strongest.intensity / 100) * 0.75);
	const spread = 12 + (strongest.intensity / 100) * 36;
	return {
		boxShadow: `0 0 ${spread}px ${spread * 0.6}px ${strongest.tint}`,
		opacity,
	};
}

export function PreviewStage() {
	const open = useVisualNoteStore((s) => s.preview.open);
	const performers = useVisualNoteStore((s) => s.preview.performers);
	const closePreview = useVisualNoteStore((s) => s.closePreview);

	const stageRef = useRef<HTMLDivElement>(null);
	const performerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	useEffect(() => {
		if (!open) return;

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") closePreview();
		};
		window.addEventListener("keydown", handleKey);

		let raf = 0;
		const start = performance.now();
		const loop = (now: number) => {
			const t = (now - start) / 1000;
			const stageWidth = stageRef.current?.clientWidth ?? 0;
			const travelWidth = Math.max(stageWidth - PERFORMER_WIDTH - 32, 0);
			for (const performer of performers) {
				const el = performerRefs.current.get(performer.id);
				if (!el) continue;
				const { x, y } = computeOffset(t, performer, travelWidth);
				el.style.transform = `translate(${x}px, ${y}px)`;
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("keydown", handleKey);
		};
	}, [open, performers, closePreview]);

	if (!open) return null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss; Escape and close button also provided
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
			onMouseDown={closePreview}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: stops backdrop dismiss when interacting inside the window */}
			<div
				className="w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-zinc-700 bg-zinc-900"
				onMouseDown={(e) => e.stopPropagation()}
			>
				{/* fake browser chrome */}
				<div className="flex items-center gap-3 px-4 h-10 bg-zinc-800 border-b border-zinc-700">
					<div className="flex items-center gap-1.5">
						<span className="w-3 h-3 rounded-full bg-red-500" />
						<span className="w-3 h-3 rounded-full bg-yellow-500" />
						<span className="w-3 h-3 rounded-full bg-green-500" />
					</div>
					<div className="flex-1 mx-2 h-6 rounded-md bg-zinc-900 border border-zinc-700 flex items-center px-3">
						<span className="text-zinc-500 text-xs truncate">
							stage://preview
						</span>
					</div>
					<button
						type="button"
						aria-label="미리보기 닫기"
						className="text-zinc-400 hover:text-zinc-200 text-lg leading-none"
						onClick={closePreview}
					>
						×
					</button>
				</div>

				{/* stage */}
				<div
					ref={stageRef}
					className="relative h-96 bg-linear-to-b from-zinc-900 to-zinc-950 overflow-hidden"
				>
					{/* ground line */}
					<div className="absolute bottom-10 left-0 right-0 border-t border-zinc-700/60" />

					<div className="absolute inset-0 flex flex-col">
						{performers.map((performer) => (
							<div key={performer.id} className="relative flex-1 min-h-0">
								<div
									ref={(el) => {
										if (el) performerRefs.current.set(performer.id, el);
										else performerRefs.current.delete(performer.id);
									}}
									className="absolute bottom-2 left-4 flex items-center justify-center will-change-transform"
									style={{ width: PERFORMER_WIDTH, height: PERFORMER_WIDTH }}
								>
									<div
										className="absolute inset-0 rounded-full"
										style={glowStyle(performer)}
									/>
									<Image
										src={performer.image}
										alt="도로롱"
										width={Math.round(56 * performer.size)}
										height={Math.round(56 * performer.size)}
										className="relative object-contain select-none pointer-events-none"
										draggable={false}
									/>
									{performer.effects.map((effect, i) => (
										<span
											key={effect.kind}
											className="absolute -top-1 -right-1 text-lg animate-pulse"
											style={{ transform: `translateX(${i * 14}px)` }}
										>
											{NODE_DEFS[effect.kind].icon}
										</span>
									))}
								</div>
							</div>
						))}
					</div>

					{performers.length === 0 && (
						<div className="absolute inset-0 flex items-center justify-center">
							<p className="text-zinc-600 text-sm">표시할 캐릭터가 없습니다.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
