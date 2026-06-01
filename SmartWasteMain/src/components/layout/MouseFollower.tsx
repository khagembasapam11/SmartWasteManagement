import { useEffect, useState } from "react";

export default function MouseFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === "pointer");
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      className="mouse-glow"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: isPointer ? "200px" : "400px",
        height: isPointer ? "200px" : "400px",
        opacity: position.x === 0 ? 0 : 1
      }}
    />
  );
}
