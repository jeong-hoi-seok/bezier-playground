import { Canvas } from "@/components/visual-note/Canvas";
import { Header } from "@/components/visual-note/Header";
import { NodePanel } from "@/components/visual-note/NodePanel";
import { Terminal } from "@/components/visual-note/Terminal";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <NodePanel />
        <Canvas />
      </div>
      <Terminal />
    </div>
  );
}
