import { Canvas } from "@/components/visual-note/Canvas";
import { NodePanel } from "@/components/visual-note/NodePanel";

export default function Home() {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <NodePanel />
      <Canvas />
    </div>
  );
}
