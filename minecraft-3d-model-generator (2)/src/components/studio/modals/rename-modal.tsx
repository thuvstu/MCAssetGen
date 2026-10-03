"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import Modal from "@/components/ui/modal";
import { useStudioStore } from "../studio-context";

export default function RenameModal() {
  const { studio, closeModal } = useStudioStore();
  const [draft, setDraft] = useState(studio.settings.name);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    studio.rename(name);
    closeModal();
  };

  return (
    <Modal title="モデル名を変更" eyebrow="MAKE IT YOURS" onClose={closeModal}>
      <p className="modal-description">
        名前は次回の生成時にモデルと一緒に保存されます。
      </p>
      <form onSubmit={submit}>
        <label className="rename-label" htmlFor="rename-input">
          モデル名
        </label>
        <input
          id="rename-input"
          className="text-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={80}
          required
        />
        <div className="modal-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={closeModal}
          >
            キャンセル
          </button>
          <button
            className="primary-button"
            disabled={!draft.trim()}
            type="submit"
          >
            <Check size={15} />
            変更する
          </button>
        </div>
      </form>
    </Modal>
  );
}
