import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  compact = false,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-center animate-fade-up ${compact ? "px-4 py-8" : "px-6 py-16"} ${className}`}
    >
      <div
        className={`mb-4 flex items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-soft ${compact ? "h-12 w-12" : "h-16 w-16"}`}
      >
        {icon ?? <PawPrint className={compact ? "h-6 w-6" : "h-8 w-8"} />}
      </div>
      <h3
        className={`font-display font-semibold tracking-tight text-foreground ${compact ? "text-base" : "text-2xl"}`}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {(actionLabel || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button
              size={compact ? "sm" : "default"}
              onClick={onAction}
              className="rounded-full gradient-primary text-primary-foreground shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-glow"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};

export default EmptyState;