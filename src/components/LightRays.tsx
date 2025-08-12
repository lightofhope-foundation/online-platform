/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client";

import { useRef, useEffect, useState } from "react";
import { Renderer, Program, Triangle, Mesh } from "ogl";

const DEFAULT_COLOR = "#53e0b6";

// Type definitions for OGL objects
interface OGLRenderer {
  dpr: number;
  gl: any;
  setSize: (w: number, h: number) => void;
  render: (args: { scene: any }) => void;
}

type OGLMesh = any; // OGL Mesh object

interface OGLUniforms {
  iTime: { value: number };
  iResolution: { value: [number, number] };
  rayPos: { value: [number, number] };
  rayDir: { value: [number, number] };
  raysColor: { value: [number, number, number] };
  raysSpeed: { value: number };
  lightSpread: { value: number };
  rayLength: { value: number };
  pulsating: { value: number };
  fadeDistance: { value: number };
  saturation: { value: number };
  mousePos: { value: [number, number] };
  mouseInfluence: { value: number };
  noiseAmount: { value: number };
  distortion: { value: number };
}

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [
        parseInt(m[1], 16) / 255,
        parseInt(m[2], 16) / 255,
        parseInt(m[3], 16) / 255,
      ]
    : [1, 1, 1];
};

const getAnchorAndDir = (origin: string, w: number, h: number): { anchor: [number, number]; dir: [number, number] } => {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case "top-right":
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case "left":
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case "right":
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case "bottom-center":
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case "bottom-right":
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: // "top-center"
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

interface LightRaysProps {
  raysOrigin?: string;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
}

export function LightRays({
  raysOrigin = "top-center",
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
  className = "",
}: LightRaysProps) {
  console.log("LightRays component mounting with color:", raysColor);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniformsRef = useRef<OGLUniforms | null>(null);
  const rendererRef = useRef<OGLRenderer | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationIdRef = useRef<number | null>(null);
  const meshRef = useRef<OGLMesh | null>(null);
  const cleanupFunctionRef = useRef<(() => void) | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Log when component first renders
  useEffect(() => {
    console.log("LightRays component rendered, container:", containerRef.current);
  }, []);

  useEffect(() => {
    console.log("Container ref changed:", containerRef.current);
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log("LightRays visibility changed:", entry.isIntersecting);
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    if (cleanupFunctionRef.current) {
      cleanupFunctionRef.current();
      cleanupFunctionRef.current = null;
    }

    const initializeWebGL = async () => {
      console.log("Starting WebGL initialization...");
      if (!containerRef.current) {
        console.error("Container ref is null!");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      if (!containerRef.current) {
        console.error("Container ref is still null after delay!");
        return;
      }

      try {
        console.log("Creating OGL renderer...");
        const renderer = new Renderer({
          dpr: Math.min(window.devicePixelRatio, 2),
          alpha: true,
        }) as unknown as OGLRenderer;
        rendererRef.current = renderer;

        console.log("Renderer created, gl context:", renderer.gl);
        const gl = renderer.gl;
        
        // Check if WebGL context is valid
        if (!gl) {
          console.error("WebGL context is null!");
          return;
        }

        console.log("Setting canvas styles...");
        gl.canvas.style.width = "100%";
        gl.canvas.style.height = "100%";
        
        // Force canvas to get proper dimensions
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        console.log("Container dimensions:", containerWidth, "x", containerHeight);
        
        // Set the actual canvas size
        gl.canvas.width = containerWidth;
        gl.canvas.height = containerHeight;
        
        // Set the WebGL viewport
        gl.viewport(0, 0, containerWidth, containerHeight);
        
        console.log("Canvas dimensions set to:", gl.canvas.width, "x", gl.canvas.height);

        console.log("Clearing container and appending canvas...");
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(gl.canvas);
        console.log("Canvas appended to container");
        
        // Ensure canvas is visible and properly sized
        gl.canvas.style.display = "block";
        gl.canvas.style.position = "absolute";
        gl.canvas.style.top = "0";
        gl.canvas.style.left = "0";
        gl.canvas.style.width = "100%";
        gl.canvas.style.height = "100%";
        
        // Force a reflow to ensure dimensions are applied
        gl.canvas.offsetHeight;
        
        // TEMPORARY: Add bright background to test visibility
        gl.clearColor(1.0, 0.0, 0.0, 1.0); // Bright red
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        console.log("Final canvas styles applied");

        console.log("Creating shaders...");
        const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

        const frag = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`;

        console.log("Creating uniforms...");
        const uniforms: OGLUniforms = {
          iTime: { value: 0 },
          iResolution: { value: [1, 1] },

          rayPos: { value: [0, 0] },
          rayDir: { value: [0, 1] },

          raysColor: { value: hexToRgb(raysColor) },
          raysSpeed: { value: raysSpeed },
          lightSpread: { value: lightSpread },
          rayLength: { value: rayLength },
          pulsating: { value: pulsating ? 1.0 : 0.0 },
          fadeDistance: { value: fadeDistance },
          saturation: { value: saturation },
          mousePos: { value: [0.5, 0.5] },
          mouseInfluence: { value: mouseInfluence },
          noiseAmount: { value: noiseAmount },
          distortion: { value: distortion },
        };
        uniformsRef.current = uniforms;

        console.log("Creating geometry, program, and mesh...");
        const geometry = new Triangle(renderer.gl);
        const program = new Program(renderer.gl, {
          vertex: vert,
          fragment: frag,
          uniforms,
        });
        const mesh = new Mesh(renderer.gl, { geometry, program });
        meshRef.current = mesh;

        console.log("WebGL setup complete, starting render loop...");

        const updatePlacement = () => {
          if (!containerRef.current || !renderer) return;

          console.log("Updating placement...");
          renderer.dpr = Math.min(window.devicePixelRatio, 2);

          const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
          console.log("Container CSS dimensions:", wCSS, "x", hCSS);
          
          renderer.setSize(wCSS, hCSS);

          const dpr = renderer.dpr;
          const w = wCSS * dpr;
          const h = hCSS * dpr;
          
          console.log("WebGL dimensions:", w, "x", h);

          uniforms.iResolution.value = [w, h];

          const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
          uniforms.rayPos.value = anchor;
          uniforms.rayDir.value = dir;
          
          console.log("Placement updated, rayPos:", anchor, "rayDir:", dir);
        };

        const loop = (t: number) => {
          if (!rendererRef.current || !uniformsRef.current || !meshRef.current) {
            console.warn("Render loop: missing refs, stopping");
            return;
          }

          try {
            uniforms.iTime.value = t * 0.001;

            if (followMouse && mouseInfluence > 0.0) {
              const smoothing = 0.92;

              smoothMouseRef.current.x =
                smoothMouseRef.current.x * smoothing +
                mouseRef.current.x * (1 - smoothing);
              smoothMouseRef.current.y =
                smoothMouseRef.current.y * smoothing +
                mouseRef.current.y * (1 - smoothing);

              uniforms.mousePos.value = [
                smoothMouseRef.current.x,
                smoothMouseRef.current.y,
              ];
            }

            renderer.render({ scene: mesh });
            animationIdRef.current = requestAnimationFrame(loop);
          } catch (error) {
            console.error("WebGL rendering error in loop:", error);
            return;
          }
        };

        window.addEventListener("resize", updatePlacement);
        updatePlacement();
        animationIdRef.current = requestAnimationFrame(loop);

        cleanupFunctionRef.current = () => {
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
          }

          window.removeEventListener("resize", updatePlacement);

          if (renderer) {
            try {
              const canvas = renderer.gl.canvas;
              const loseContextExt = renderer.gl.getExtension("WEBGL_lose_context");
              if (loseContextExt) {
                loseContextExt.loseContext();
              }

              if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
              }
            } catch (error) {
              console.warn("Error during WebGL cleanup:", error);
            }
          }

          rendererRef.current = null;
          uniformsRef.current = null;
          meshRef.current = null;
        };
      } catch (error) {
        console.error("Error during WebGL initialization:", error);
      }
    };

    initializeWebGL();

    return () => {
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
    };
  }, [
    isVisible,
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  useEffect(() => {
    if (!uniformsRef.current || !containerRef.current || !rendererRef.current)
      return;

    const u = uniformsRef.current;
    const renderer = rendererRef.current;

    u.raysColor.value = hexToRgb(raysColor);
    u.raysSpeed.value = raysSpeed;
    u.lightSpread.value = lightSpread;
    u.rayLength.value = rayLength;
    u.pulsating.value = pulsating ? 1.0 : 0.0;
    u.fadeDistance.value = fadeDistance;
    u.saturation.value = saturation;
    u.mouseInfluence.value = mouseInfluence;
    u.noiseAmount.value = noiseAmount;
    u.distortion.value = distortion;

    const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
    const dpr = renderer.dpr;
    const { anchor, dir } = getAnchorAndDir(raysOrigin, wCSS * dpr, hCSS * dpr);
    u.rayPos.value = anchor;
    u.rayDir.value = dir;
  }, [
    raysColor,
    raysSpeed,
    lightSpread,
    raysOrigin,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !rendererRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = { x, y };
    };

    if (followMouse) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [followMouse]);

  return (
    <div
      ref={containerRef}
      className={`light-rays-container ${className}`.trim()}
      style={{ 
        background: 'rgba(83, 224, 182, 0.1)', 
        border: '2px solid #53e0b6',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    >
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        color: '#53e0b6',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        Light Rays Container
        <br />
        <small style={{ fontSize: '14px' }}>
          WebGL: {rendererRef.current ? 'Initialized' : 'Not Ready'}
        </small>
      </div>
    </div>
  );
}


