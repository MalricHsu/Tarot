type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
};

export default function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`segmented__item${active ? ' is-active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
