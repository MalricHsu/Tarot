import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: ReactNode;
  /** 右側單一動作鈕（選用）。 */
  action?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, action, className }: PageHeaderProps) {
  return (
    <header className={`page-header${className ? ` ${className}` : ''}`}>
      <h1 className="page-header__title">{title}</h1>
      {action ? <div className="page-header__action">{action}</div> : null}
    </header>
  );
}
