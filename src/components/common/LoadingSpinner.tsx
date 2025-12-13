import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export const LoadingSpinner = ({ 
  size = "md", 
  className,
  message 
}: LoadingSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="mt-4 text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

// Full page loading state
export const PageLoader = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
};
