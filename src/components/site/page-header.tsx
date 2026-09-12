import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              {icon}
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
