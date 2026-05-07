"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Sparkles, Sphere } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import { AdditiveBlending, MathUtils } from "three";
import type { BufferAttribute, Group, Points, ShaderMaterial } from "three";

type LandingSceneProps = {
  progress: number;
};

function OrbitalShapes({ progress }: LandingSceneProps) {
  const rootRef = useRef<Group>(null);
  const innerParticlesRef = useRef<Points>(null);
  const outerParticlesRef = useRef<Points>(null);
  const orangeParticlesRef = useRef<Points>(null);
  const coreMaterialRef = useRef<ShaderMaterial>(null);
  const glowMaterialRef = useRef<ShaderMaterial>(null);
  const smoothProgressRef = useRef(0);
  const innerParticlePositions = useMemo(() => createParticlePositions(9000, 0.98), []);
  const outerParticlePositions = useMemo(() => createParticlePositions(6800, 1.38), []);
  const orangeParticlePositions = useMemo(() => createParticlePositions(7200, 1.28), []);

  useFrame((state, delta) => {
    if (
      !rootRef.current ||
      !innerParticlesRef.current ||
      !outerParticlesRef.current ||
      !orangeParticlesRef.current
    ) {
      return;
    }
    smoothProgressRef.current = MathUtils.damp(smoothProgressRef.current, progress, 6.5, delta);
    const smoothProgress = smoothProgressRef.current;
    rootRef.current.rotation.y += delta * 0.065;
    rootRef.current.scale.setScalar(0.54);
    rootRef.current.position.x = smoothProgress * 1.7;
    rootRef.current.position.y = 0.58 - smoothProgress * 0.22;
    rootRef.current.position.z = smoothProgress * 0.06;
    rootRef.current.rotation.x = 0;

    innerParticlesRef.current.rotation.y += delta * 0.45;
    innerParticlesRef.current.rotation.x -= delta * 0.22;
    outerParticlesRef.current.rotation.y -= delta * 0.2;
    orangeParticlesRef.current.rotation.y += delta * 0.38;
    const pointerStrength = 1;
    nudgeParticles(
      innerParticlesRef.current.geometry.attributes.position as BufferAttribute,
      innerParticlePositions,
      0,
      0,
      pointerStrength,
      0.93
    );
    nudgeParticles(
      outerParticlesRef.current.geometry.attributes.position as BufferAttribute,
      outerParticlePositions,
      0,
      0,
      pointerStrength * 0.65,
      1.36
    );
    nudgeParticles(
      orangeParticlesRef.current.geometry.attributes.position as BufferAttribute,
      orangeParticlePositions,
      0,
      0,
      pointerStrength * 0.95,
      1.26
    );

    if (coreMaterialRef.current) {
      coreMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      coreMaterialRef.current.uniforms.uPointer.value = [0, 0];
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      glowMaterialRef.current.uniforms.uIntensity.value = 0.9 + Math.sin(state.clock.elapsedTime * 0.9) * 0.12;
    }
  });

  return (
    <group ref={rootRef}>
      <Sphere args={[1.06, 120, 120]} position={[0, 0, 0]}>
        <shaderMaterial
          ref={coreMaterialRef}
          transparent={false}
          uniforms={{
            uTime: { value: 0 },
            uPointer: { value: [0, 0] },
          }}
          vertexShader={SUN_VERTEX_SHADER}
          fragmentShader={SUN_FRAGMENT_SHADER}
        />
      </Sphere>
      <Sphere args={[1.1, 120, 120]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </Sphere>
      <points ref={innerParticlesRef} key={`inner-points-${innerParticlePositions.length}`}>
        <bufferGeometry key={`inner-geometry-${innerParticlePositions.length}`}>
          <bufferAttribute
            key={`inner-attr-${innerParticlePositions.length}`}
            attach="attributes-position"
            args={[innerParticlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#ff8d1a" size={0.032} sizeAttenuation transparent opacity={0.9} />
      </points>
      <points ref={outerParticlesRef} key={`outer-points-${outerParticlePositions.length}`}>
        <bufferGeometry key={`outer-geometry-${outerParticlePositions.length}`}>
          <bufferAttribute
            key={`outer-attr-${outerParticlePositions.length}`}
            attach="attributes-position"
            args={[outerParticlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#ffd57b" size={0.02} sizeAttenuation transparent opacity={0.44} />
      </points>
      <points ref={orangeParticlesRef} key={`orange-points-${orangeParticlePositions.length}`}>
        <bufferGeometry key={`orange-geometry-${orangeParticlePositions.length}`}>
          <bufferAttribute
            key={`orange-attr-${orangeParticlePositions.length}`}
            attach="attributes-position"
            args={[orangeParticlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#ff8a1f" size={0.022} sizeAttenuation transparent opacity={0.5} />
      </points>
      <Sparkles
        count={3200}
        size={2.8}
        speed={0.18}
        noise={0.46}
        scale={[2.35, 2.35, 2.35]}
        color="#ffb347"
        opacity={0.5}
      />
      <Sparkles
        count={2400}
        size={2.4}
        speed={0.72}
        noise={0.52}
        scale={[2.25, 2.25, 2.25]}
        color="#ff7a14"
        opacity={0.42}
      />
      <Sphere args={[1.3, 72, 72]}>
        <meshPhysicalMaterial
          color="#ffc877"
          emissive="#ff7a12"
          emissiveIntensity={0.95}
          transparent
          opacity={0.14}
          transmission={0.18}
          roughness={0.45}
        />
      </Sphere>
      <Sphere args={[1.56, 72, 72]}>
        <shaderMaterial
          ref={glowMaterialRef}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uIntensity: { value: 1 },
          }}
          vertexShader={GLOW_VERTEX_SHADER}
          fragmentShader={GLOW_FRAGMENT_SHADER}
        />
      </Sphere>
    </group>
  );
}

export function LandingScene({ progress }: LandingSceneProps) {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0.3, 3.5], fov: 42 }}>
        <ambientLight intensity={0.05} />
        <pointLight intensity={4.4} position={[0.1, 0.3, 1]} color="#ff8b26" />
        <directionalLight intensity={0.44} position={[2, 4, 2]} color="#ffc782" />
        <directionalLight intensity={0.14} position={[-3, -2, -1]} color="#ffd9a0" />
        <OrbitalShapes progress={progress} />
        <Environment preset="studio" />
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.16}
            luminanceSmoothing={0.55}
            radius={0.72}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function createParticlePositions(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * radius;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

function nudgeParticles(
  attribute: BufferAttribute,
  original: Float32Array,
  pointerX: number,
  pointerY: number,
  intensity: number,
  limit: number
) {
  const arr = attribute.array as Float32Array;
  const influenceX = pointerX * 0.13 * intensity;
  const influenceY = pointerY * 0.13 * intensity;
  for (let i = 0; i < arr.length; i += 3) {
    const ox = original[i];
    const oy = original[i + 1];
    const oz = original[i + 2];
    const nextX = ox + influenceX * (0.4 + Math.abs(oz) * 0.5);
    const nextY = oy + influenceY * (0.4 + Math.abs(ox) * 0.5);
    const nextZ = oz + (influenceX - influenceY) * 0.15;
    const length = Math.hypot(nextX, nextY, nextZ) || 1;
    const clamp = Math.min(length, limit);
    arr[i] = (nextX / length) * clamp;
    arr[i + 1] = (nextY / length) * clamp;
    arr[i + 2] = (nextZ / length) * clamp;
  }
  attribute.needsUpdate = true;
}

const SUN_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 modelPos = modelMatrix * vec4(position, 1.0);
  vPosition = modelPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * modelPos;
}
`;

const SUN_FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uPointer;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 flow = vUv * 6.0 + vec2(uTime * 0.28, -uTime * 0.16);
  float n1 = noise(flow);
  float n2 = noise(flow * 1.9 + vec2(2.7, -1.3) + uTime * 0.21);
  float plasma = mix(n1, n2, 0.52);

  float pointerInfluence = length(uPointer) * 0.18;
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
  float coreHeat = smoothstep(0.2, 1.0, plasma + pointerInfluence);

  vec3 deepOrange = vec3(1.0, 0.33, 0.02);
  vec3 midOrange = vec3(1.0, 0.55, 0.10);
  vec3 hotYellow = vec3(1.0, 0.78, 0.30);

  vec3 color = mix(deepOrange, midOrange, plasma);
  color = mix(color, hotYellow, coreHeat * 0.72);
  color += fresnel * vec3(1.0, 0.45, 0.1) * 0.36;

  gl_FragColor = vec4(color, 1.0);
}
`;

const GLOW_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const GLOW_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
  float pulse = 0.86 + sin(uTime * 1.2) * 0.14;
  float glow = pow(rim, 2.6) * pulse * uIntensity;
  vec3 color = vec3(1.0, 0.52, 0.14) * glow;
  gl_FragColor = vec4(color, glow * 0.42);
}
`;
