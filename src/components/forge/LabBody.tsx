'use client';

import { Component, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { muscleNames, type Muscle } from '@/lib/lab';

type BodyProps = { muscles: Muscle[]; back: boolean };
const subscribe = () => () => {};
let supported: boolean | undefined;
function hasWebGL() {
  if (supported !== undefined) return supported;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { supported = false; }
  return supported;
}
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}

function StaticBody({ muscles, back }: BodyProps) {
  const color = (muscle: Muscle) => muscles.includes(muscle) ? '#ee7247' : '#c8ced5';
  return <svg viewBox="0 0 200 340" aria-hidden="true" className="lab-static-body">
    <circle cx="100" cy="38" r="23" fill="#d5dae0" />
    <path d="M91 57h18v22H91z" fill="#d5dae0" />
    <path d="M61 83Q100 65 139 83l-13 100H74z" fill="#d5dae0" />
    <path d="M76 94h48v43H76z" fill={color(back ? 'back' : 'chest')} rx="12" />
    <path d="M82 142h36v38H82z" fill={color(back ? 'back' : 'core')} />
    <path d="M74 183h52l9 32H65z" fill="#d5dae0" />
    {[false, true].map(right => <g key={String(right)} transform={right ? 'translate(200 0) scale(-1 1)' : undefined}>
      <ellipse cx="59" cy="93" rx="17" ry="20" fill={color('shoulders')} />
      <path d="M44 106l22 6-9 57-19-4z" fill={color('arms')} />
      <path d="M38 165l19 4-13 50-15-5z" fill={color('arms')} />
      <ellipse cx="34" cy="226" rx="10" ry="14" fill="#d5dae0" />
      <path d="M67 211h28l-5 59H65zM65 275h25l-3 47H67z" fill={color('legs')} />
      <rect x="62" y="320" width="29" height="12" rx="5" fill="#d5dae0" />
    </g>)}
  </svg>;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Part({ position, scale, color = '#d3d9df' }: { position: [number, number, number]; scale: [number, number, number]; color?: string }) {
  return <mesh position={position} scale={scale}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={color} roughness={.65} metalness={.08} /></mesh>;
}
function Body({ muscles, back, animate }: BodyProps & { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const color = (muscle: Muscle) => muscles.includes(muscle) ? '#ee7247' : '#c5cdd5';
  useFrame((state, delta) => {
    if (!group.current || !animate) return;
    const target = (back ? Math.PI : 0) + state.pointer.x * .25;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 6, delta);
  });
  return <>
    <ambientLight intensity={2} /><directionalLight position={[3, 5, 6]} intensity={3} /><directionalLight position={[-3, 1, -4]} intensity={2} />
    <group ref={group} rotation={[0, back ? Math.PI : 0, 0]}>
      <Part position={[0, 1.73, 0]} scale={[.23, .3, .23]} />
      <Part position={[0, 1.36, 0]} scale={[.13, .17, .13]} />
      <Part position={[0, .98, 0]} scale={[.5, .43, .25]} />
      <Part position={[0, .48, 0]} scale={[.32, .38, .21]} />
      <Part position={[0, .08, 0]} scale={[.39, .24, .23]} />
      <Part position={[0, .98, -.23]} scale={[.41, .33, .07]} color={color('back')} />
      {[-1, 1].map(side => <group key={side}>
        <Part position={[side * .23, 1.02, .23]} scale={[.23, .22, .09]} color={color('chest')} />
        <Part position={[side * .13, .55, .2]} scale={[.12, .28, .07]} color={color('core')} />
        <Part position={[side * .56, 1.12, 0]} scale={[.21, .23, .22]} color={color('shoulders')} />
        <group position={[side * .68, .73, 0]} rotation={[0, 0, side * .2]}><Part position={[0, 0, 0]} scale={[.15, .34, .15]} color={color('arms')} /></group>
        <group position={[side * .8, .22, 0]} rotation={[0, 0, side * .2]}><Part position={[0, 0, 0]} scale={[.12, .27, .12]} color={color('arms')} /></group>
        <Part position={[side * .86, -.12, 0]} scale={[.11, .16, .07]} />
        <Part position={[side * .22, -.48, 0]} scale={[.2, .48, .2]} color={color('legs')} />
        <Part position={[side * .23, -1.24, 0]} scale={[.14, .35, .14]} color={color('legs')} />
        <Part position={[side * .23, -1.65, .1]} scale={[.15, .1, .26]} />
      </group>)}
    </group>
  </>;
}

export default function LabBody({ muscles }: { muscles: Muscle[] }) {
  const [back, setBack] = useState(false);
  const capable = useSyncExternalStore(subscribe, hasWebGL, () => false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const fallback = <StaticBody muscles={muscles} back={back} />;
  return <section className="lab-body-card" aria-label="Muscle diagram">
    <div className="lab-card-heading"><span>Muscles in focus</span><div className="lab-view-toggle" role="group" aria-label="Body view">{[false, true].map(view => <button key={String(view)} aria-pressed={back === view} onClick={() => setBack(view)}>{view ? 'Back' : 'Front'}</button>)}</div></div>
    <div className="lab-body-scene" aria-hidden="true">{capable ? <SceneBoundary fallback={fallback}><Canvas camera={{ position: [0, .12, 6.4], fov: 38 }} dpr={[1, 1.4]} frameloop={!reduced && visible ? 'always' : 'demand'} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}><Body muscles={muscles} back={back} animate={!reduced && visible} /></Canvas></SceneBoundary> : fallback}</div>
    <div className="lab-muscles">{muscles.map(muscle => <span key={muscle}><i />{muscleNames[muscle]}</span>)}</div>
    <p className="lab-caption">A simple muscle guide, not an anatomical model.</p>
  </section>;
}
