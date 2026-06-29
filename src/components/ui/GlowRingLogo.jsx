import React, { useEffect, useRef } from "react";
import { ShaderMount, liquidMetalFragmentShader } from "@paper-design/shaders";

export const GlowRingLogo = ({ logoSrc, type = "logo", className = "" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let shaderMount;
    try {
      shaderMount = new ShaderMount(
        container,
        liquidMetalFragmentShader,
        {
          u_repetition: 1.5,
          u_softness: 0.5,
          u_shiftRed: 0.3,
          u_shiftBlue: 0.3,
          u_distortion: 0.0,
          u_contour: 0.0,
          u_angle: 100.0,
          u_scale: 1.5,
          u_shape: 1.0,
          u_offsetX: 0.1,
          u_offsetY: -0.1,
        },
        undefined,
        0.6,
      );
    } catch (e) {
      console.error("Failed to initialize liquid metal WebGL shader:", e);
    }

    return () => {
      if (shaderMount) {
        try {
          shaderMount.dispose();
        } catch (e) {
          console.error("Error disposing liquid metal WebGL shader:", e);
        }
      }
    };
  }, []);

  return (
    <div className={`metallic-ring-container group relative ${className}`}>
      {/* Container for the liquid metal shader canvas (rotates randomly on hover) */}
      <div
        ref={containerRef}
        className="shader-canvas-wrapper absolute inset-0 w-full h-full z-10 rounded-full overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"
      />

      {/* Dark metallic backing disc */}
      <div className="metallic-inner-disc z-20">
        {type === "home" ? (
          // SVG Home Icon styled to look metallic
          <svg
            viewBox="0 0 24 24"
            className="w-[45%] h-[45%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] filter active:scale-95 transition-transform"
            fill="url(#metallic-silver)"
          >
            <defs>
              <linearGradient
                id="metallic-silver"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#f0f0f0" />
                <stop offset="50%" stopColor="#d2d2d2" />
                <stop offset="75%" stopColor="#aeaeae" />
                <stop offset="100%" stopColor="#8a8a8a" />
              </linearGradient>
            </defs>
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        ) : (
          // Logo image overlay
          <img
            src={logoSrc}
            alt="Logo"
            className="w-[60%] h-[60%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
          />
        )}
      </div>

      {/* Outer border highlighting */}
      <div className="metallic-outer-border z-30" />
    </div>
  );
};

export default GlowRingLogo;
