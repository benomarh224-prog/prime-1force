'use client';

import { Suspense, useMemo, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Points, PointMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type FutureSceneProps = {
  variant?: 'hero' | 'ambient' | 'compact';
  className?: string;
};

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 1.1, 0.035);
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      state.pointer.y * 0.7 + Math.sin(t * 0.35) * 0.16,
      0.035
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function Barbell({ position, rotation, scale = 1 }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.75}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 2.4, 24]} />
          <meshStandardMaterial color="#d8f3ff" metalness={0.9} roughness={0.24} />
        </mesh>
        {[-1.08, -0.92, 0.92, 1.08].map((x, index) => (
          <mesh key={index} castShadow receiveShadow position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.13, 32]} />
            <meshStandardMaterial color={index < 2 ? '#ff7a1a' : '#00c2ff'} metalness={0.62} roughness={0.18} emissive={index < 2 ? '#2f1000' : '#001b26'} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Dumbbell({ position, rotation, scale = 1 }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  return (
    <Float speed={1.9} rotationIntensity={0.8} floatIntensity={0.9}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.88, 20]} />
          <meshStandardMaterial color="#f7fbff" metalness={0.82} roughness={0.2} />
        </mesh>
        {[-0.52, -0.41, 0.41, 0.52].map((x, index) => (
          <mesh key={index} castShadow position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.1, 28]} />
            <meshStandardMaterial color={index % 2 ? '#121826' : '#00c2ff'} metalness={0.7} roughness={0.18} emissive={index % 2 ? '#020407' : '#001c28'} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Kettlebell() {
  return (
    <Float speed={1.2} rotationIntensity={0.45} floatIntensity={0.7}>
      <group position={[1.55, -0.58, -0.72]} rotation={[0.18, -0.5, 0.12]} scale={0.82}>
        <mesh castShadow position={[0, 0.42, 0]}>
          <torusGeometry args={[0.36, 0.055, 16, 42, Math.PI]} />
          <meshStandardMaterial color="#dff7ff" metalness={0.84} roughness={0.2} />
        </mesh>
        <mesh castShadow>
          <sphereGeometry args={[0.43, 48, 48]} />
          <MeshDistortMaterial
            color="#111827"
            emissive="#002332"
            metalness={0.72}
            roughness={0.22}
            distort={0.08}
            speed={1.2}
          />
        </mesh>
        <mesh position={[0, -0.08, 0.41]}>
          <circleGeometry args={[0.12, 32]} />
          <meshBasicMaterial color="#ff7a1a" transparent opacity={0.85} />
        </mesh>
      </group>
    </Float>
  );
}

function ParticleField({ dense = false }: { dense?: boolean }) {
  const count = dense ? 520 : 280;
  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      array[i * 3] = (Math.random() - 0.5) * 8;
      array[i * 3 + 1] = (Math.random() - 0.5) * 5;
      array[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return array;
  }, [count]);
  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.025;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial transparent color="#9deaff" size={0.015} sizeAttenuation depthWrite={false} opacity={0.56} />
    </Points>
  );
}

function SceneObjects({ variant }: { variant: FutureSceneProps['variant'] }) {
  const compact = variant === 'compact';

  return (
    <>
      <ambientLight intensity={0.55} />
      <spotLight position={[2.8, 3.4, 3.8]} angle={0.48} penumbra={0.8} intensity={compact ? 1.6 : 2.2} color="#9deaff" castShadow />
      <pointLight position={[-2.8, -1.2, 1.8]} intensity={compact ? 1.8 : 2.9} color="#ff7a1a" />
      <pointLight position={[2.2, 0.7, -2.2]} intensity={1.6} color="#00c2ff" />

      <group position={[0, compact ? 0.05 : -0.05, 0]}>
        <Barbell position={[compact ? -0.34 : -0.72, compact ? 0.18 : 0.28, 0]} rotation={[0.42, -0.44, -0.28]} scale={compact ? 0.72 : 1} />
        <Dumbbell position={[compact ? 0.72 : 1.12, compact ? -0.04 : 0.16, compact ? 0.25 : 0.38]} rotation={[0.18, 0.65, 0.56]} scale={compact ? 0.72 : 1} />
        {!compact && <Kettlebell />}
        <mesh position={[0, -0.88, -0.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[compact ? 1.7 : 2.8, 96]} />
          <meshBasicMaterial color="#00c2ff" transparent opacity={0.07} />
        </mesh>
        <Sparkles count={compact ? 42 : 86} scale={compact ? 2.2 : 4.2} size={compact ? 1.4 : 1.9} speed={0.32} color="#b8f4ff" opacity={0.42} />
      </group>
      <ParticleField dense={variant === 'hero'} />
      <CameraRig />
    </>
  );
}

export function FutureScene({ variant = 'ambient', className = '' }: FutureSceneProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const cameraZ = variant === 'compact' ? 3.35 : 4.35;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {mounted && (
        <Canvas
          dpr={[1, 1.6]}
          shadows={variant !== 'compact'}
          camera={{ position: [0, 0, cameraZ], fov: variant === 'hero' ? 43 : 48 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <SceneObjects variant={variant} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
