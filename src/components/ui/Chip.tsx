import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children: ReactNode;
};

export default function Chip({ selected = false, className, children, ...rest }: ChipProps) {
  const classes = ['chip', selected ? 'chip--selected' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} aria-pressed={selected} {...rest}>
      {children}
    </button>
  );
}
