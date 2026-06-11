import type { CSSProperties } from 'react';

type SkeletonProps = {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
};

export function Skeleton({ width = '100%', height = '14px', radius, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  if (radius) style.borderRadius = radius;
  return <div className={`skeleton${className ? ` ${className}` : ''}`} style={style} aria-hidden />;
}

/** 多行文字佔位（shimmer）。 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-text" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

export default Skeleton;
