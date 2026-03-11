interface ToggleProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

export function Toggle({ checked, onCheckedChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={[
        "relative inline-flex h-6 w-[46px] items-center rounded-full transition-colors duration-200",
        checked ? "bg-brand-600" : "bg-surface-300",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

