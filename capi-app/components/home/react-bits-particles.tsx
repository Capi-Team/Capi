"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh } from "ogl";
import "./Particles.css";

type ParticlesProps = {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
  pixelRatio?: number;
  className?: string;
};

const defaultColors = ["#ffffff", "#ffffff", "#ffffff"];

const hexToRgb = (hex: string): [number, number, number] => {
  let safeHex = hex.replace(/^#/, "");
  if (safeHex.length === 3) safeHex = safeHex.split("").map((c) => c + c).join("");
  const int = Number.parseInt(safeHex, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
};

const vertex = `attribute vec3 position;attribute vec4 random;attribute vec3 color;uniform mat4 modelMatrix;uniform mat4 viewMatrix;uniform mat4 projectionMatrix;uniform float uTime;uniform float uSpread;uniform float uBaseSize;uniform float uSizeRandomness;varying vec4 vRandom;varying vec3 vColor;void main(){vRandom=random;vColor=color;vec3 pos=position*uSpread;pos.z*=10.0;vec4 mPos=modelMatrix*vec4(pos,1.0);float t=uTime;mPos.x+=sin(t*random.z+6.28*random.w)*mix(0.1,1.5,random.x);mPos.y+=sin(t*random.y+6.28*random.x)*mix(0.1,1.5,random.w);mPos.z+=sin(t*random.w+6.28*random.y)*mix(0.1,1.5,random.z);vec4 mvPos=viewMatrix*mPos;if(uSizeRandomness==0.0){gl_PointSize=uBaseSize;}else{gl_PointSize=(uBaseSize*(1.0+uSizeRandomness*(random.x-0.5)))/length(mvPos.xyz);}gl_Position=projectionMatrix*mvPos;}`;
const fragment = `precision highp float;uniform float uTime;uniform float uAlphaParticles;varying vec4 vRandom;varying vec3 vColor;void main(){vec2 uv=gl_PointCoord.xy;float d=length(uv-vec2(0.5));if(uAlphaParticles<0.5){if(d>0.5){discard;}gl_FragColor=vec4(vColor+0.2*sin(uv.yxx+uTime+vRandom.y*6.28),1.0);}else{float circle=smoothstep(0.5,0.4,d)*0.8;gl_FragColor=vec4(vColor+0.2*sin(uv.yxx+uTime+vRandom.y*6.28),circle);}}`;

export default function ReactBitsParticles({
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleColors,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = false,
  particleBaseSize = 100,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
  pixelRatio = 1,
  className,
}: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const renderer = new Renderer({ dpr: pixelRatio, depth: false, alpha: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, cameraDistance);
    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    window.addEventListener("resize", resize);
    resize();

    const onMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -(((e.clientY - r.top) / r.height) * 2 - 1),
      };
    };
    if (moveParticlesOnHover) container.addEventListener("mousemove", onMove);

    const positions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 4);
    const colors = new Float32Array(particleCount * 3);
    const palette = particleColors?.length ? particleColors : defaultColors;
    for (let i = 0; i < particleCount; i += 1) {
      let x; let y; let z; let len;
      do {
        x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      const rr = Math.cbrt(Math.random());
      positions.set([x * rr, y * rr, z * rr], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      colors.set(hexToRgb(palette[Math.floor(Math.random() * palette.length)]), i * 3);
    }

    const geometry = new Geometry(gl, { position: { size: 3, data: positions }, random: { size: 4, data: randoms }, color: { size: 3, data: colors } });
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: { uTime: { value: 0 }, uSpread: { value: particleSpread }, uBaseSize: { value: particleBaseSize * pixelRatio }, uSizeRandomness: { value: sizeRandomness }, uAlphaParticles: { value: alphaParticles ? 1 : 0 } },
      transparent: true,
      depthTest: false,
    });
    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const delta = t - last;
      last = t;
      elapsed += delta * speed;
      program.uniforms.uTime.value = elapsed * 0.001;
      particles.position.x = moveParticlesOnHover ? -mouseRef.current.x * particleHoverFactor : 0;
      particles.position.y = moveParticlesOnHover ? -mouseRef.current.y * particleHoverFactor : 0;
      if (!disableRotation) {
        particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        particles.rotation.z += 0.01 * speed;
      }
      renderer.render({ scene: particles, camera });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (moveParticlesOnHover) container.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
    };
  }, [particleCount, particleSpread, speed, moveParticlesOnHover, particleHoverFactor, alphaParticles, particleBaseSize, sizeRandomness, cameraDistance, disableRotation, pixelRatio, particleColors]);

  return <div ref={containerRef} className={`particles-container ${className ?? ""}`} />;
}
