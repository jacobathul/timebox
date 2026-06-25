import { PRESET_COLORS } from '../../store/useContextStore';

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export function ContextColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full border-2 transition-all ${value === color ? 'border-stone-800 scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
