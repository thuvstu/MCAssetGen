"use client";

import { Box, CircleHelp } from "lucide-react";
import { useStudioStore } from "./studio-context";

export default function StatusBar() {
  const { openModal } = useStudioStore();

  return (
    <footer className="app-statusbar">
      <div>
        <span className="system-status">
          <i />
          すべてのシステム正常
        </span>
        <span className="footer-separator" />
        <span className="engine-label">
          Voxel Engine <b>1.0</b>
        </span>
      </div>
      <div>
        <span>
          <Box size={10} />
          Minecraft Java Edition
        </span>
        <span className="footer-separator" />
        <span>Blockbench compatible</span>
        <span className="footer-version">v.1.0.0</span>
        <button title="ヘルプ" onClick={() => openModal("help")}>
          <CircleHelp size={12} />
        </button>
      </div>
    </footer>
  );
}
