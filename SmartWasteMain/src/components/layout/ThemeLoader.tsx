import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";

export default function ThemeLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background mesh-gradient transition-opacity duration-1000">
      <div className="relative">
        {/* Pulsing Outer Ring */}
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        
        {/* Rotating Core */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10 shadow-glow backdrop-blur-xl animate-spin" style={{ animationDuration: '8s' }}>
          <Logo className="h-16 w-16" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase">EcoCity</h2>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-loader-progress bg-white shadow-glow" />
        </div>
        <p className="text-xs font-medium text-white/60 uppercase tracking-tighter">Initializing smart systems...</p>
      </div>
    </div>
  );
}
