import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      <h2 className="empty-state__title">{title}</h2>
      {description ? <p className="empty-state__desc">{description}</p> : null}
      {action}
    </div>
  );
}
