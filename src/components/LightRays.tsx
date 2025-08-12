"use client";

import { useEffect, useRef } from "react";

interface LightRaysProps {
  raysColor?: string;
  className?: string;
}

const LightRays: React.FC<LightRaysProps> = ({ 
  raysColor = "#53e0b6", 
  className = "" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create multiple light ray elements
    const container = containerRef.current;
    container.innerHTML = '';

    // Create 8 light rays
    for (let i = 0; i < 8; i++) {
      const ray = document.createElement('div');
      ray.style.cssText = `
        position: absolute;
        top: 0;
        left: 50%;
        width: 2px;
        height: 100vh;
        background: linear-gradient(to bottom, ${raysColor}00, ${raysColor}40, ${raysColor}00);
        transform: translateX(-50%) rotate(${i * 45 - 90}deg);
        transform-origin: top center;
        animation: rayMove 3s ease-in-out infinite;
        animation-delay: ${i * 0.2}s;
        z-index: 1;
        pointer-events: none;
      `;
      container.appendChild(ray);
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rayMove {
        0%, 100% { opacity: 0.3; transform: translateX(-50%) rotate(var(--rotation)) scaleY(0.8); }
        50% { opacity: 0.8; transform: translateX(-50%) rotate(var(--rotation)) scaleY(1.2); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [raysColor]);

  return (
    <div
      ref={containerRef}
      className={`light-rays-container ${className}`.trim()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    />
  );
};

export default LightRays;


