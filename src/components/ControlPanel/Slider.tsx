interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const display = step < 1 ? value.toFixed(step < 0.5 ? 2 : 1) : String(value);
  const id = `slider-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="mb-3" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex justify-between mb-0.5">
        <label
          id={`${id}-label`}
          htmlFor={id}
          className="text-[11px] text-neutral-400"
        >
          {label}
        </label>
        <span
          className="text-[11px] font-mono"
          style={{ color: "#ef4444" }}
          aria-live="polite"
        >
          {display}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer accent-red-500"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${display}${unit}`}
      />
    </div>
  );
}
