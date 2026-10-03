"use client";

import {
  Box,
  Check,
  Grid3X3,
  RotateCcw,
  RotateCw,
  type LucideIcon,
} from "lucide-react";
import { ForgeLogo } from "@/components/pixel-art";
import Modal from "@/components/ui/modal";
import Toggle from "@/components/ui/toggle";
import { useStudioStore } from "../studio-context";

interface PreferenceRow {
  icon: LucideIcon;
  title: string;
  description: string;
  key: "grid" | "wireframe" | "autoRotate";
  toggle: () => void;
}

export default function PreferencesModal() {
  const { viewport, viewportActions, closeModal, notify } = useStudioStore();

  const rows: PreferenceRow[] = [
    {
      icon: Grid3X3,
      title: "グリッドを表示",
      description: "モデルの立体感と位置を確認",
      key: "grid",
      toggle: viewportActions.toggleGrid,
    },
    {
      icon: Box,
      title: "ワイヤーフレーム",
      description: "キューブの構造を線で表示",
      key: "wireframe",
      toggle: viewportActions.toggleWireframe,
    },
    {
      icon: RotateCw,
      title: "自動回転",
      description: "さまざまな角度から仕上がりを確認",
      key: "autoRotate",
      toggle: viewportActions.toggleAutoRotate,
    },
  ];

  return (
    <Modal
      title="ワークスペース設定"
      eyebrow="MAKE YOURSELF AT HOME"
      onClose={closeModal}
    >
      <p className="modal-description">
        制作しやすいプレビューにカスタマイズ。
      </p>

      <div className="preference-rows">
        {rows.map((row) => (
          <div className="preference-row" key={row.key}>
            <div>
              <row.icon size={18} />
              <span>
                <strong>{row.title}</strong>
                <small>{row.description}</small>
              </span>
            </div>
            <Toggle
              checked={viewport[row.key]}
              onChange={row.toggle}
              label={`設定: ${row.title}`}
            />
          </div>
        ))}
      </div>

      <div className="settings-about">
        <ForgeLogo small />
        <span>
          <strong>VoxelForge Studio</strong>
          <small>Voxel Engine 1.0 · あなたの創造力のために。</small>
        </span>
        <span>v1.0.0</span>
      </div>

      <div className="modal-actions">
        <button
          className="text-button"
          onClick={() => {
            viewportActions.restoreDefaults();
            notify("表示設定をリセットしました。");
          }}
        >
          <RotateCcw size={13} />
          初期設定に戻す
        </button>
        <button className="primary-button" onClick={closeModal}>
          完了
          <Check size={14} />
        </button>
      </div>
    </Modal>
  );
}
