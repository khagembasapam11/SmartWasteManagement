import { Recycle } from "lucide-react";

export default function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className={`absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md ${className}`} />
      <div className={`relative flex items-center justify-center rounded-lg bg-gradient-hero shadow-glow p-1.5 ${className}`}>
        <Recycle className="h-full w-full text-white" />
      </div>
    </div>
  );
}
