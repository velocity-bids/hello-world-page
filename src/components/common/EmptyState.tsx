import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) => {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} size="lg">
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
