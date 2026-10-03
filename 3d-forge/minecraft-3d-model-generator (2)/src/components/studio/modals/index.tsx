"use client";

import { useStudioStore } from "../studio-context";
import ExportModal from "./export-modal";
import HelpModal from "./help-modal";
import LibraryModal from "./library-modal";
import PreferencesModal from "./preferences-modal";
import RenameModal from "./rename-modal";

/** Renders the single active dialog, if any. */
export default function ModalHost() {
  const { modal } = useStudioStore();

  switch (modal) {
    case "export":
      return <ExportModal />;
    case "library":
      return <LibraryModal />;
    case "help":
      return <HelpModal />;
    case "rename":
      return <RenameModal />;
    case "preferences":
      return <PreferencesModal />;
    default:
      return null;
  }
}
