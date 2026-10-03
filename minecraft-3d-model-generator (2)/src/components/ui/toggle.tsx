interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

/** Accessible on/off switch used across the settings and preferences UI. */
export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  );
}
