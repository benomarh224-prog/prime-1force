'use client';

import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
  const color = (muscle: Muscle) => muscles.includes(muscle) ? '#ff6b19' : '#575859';
  return <svg viewBox="0 0 200 340" aria-hidden="true" className="lab-static-body">
    <ellipse cx="100" cy="38" rx="19" ry="24" fill="#898989" />
    <path d="M91 57h18v22H91z" fill="#575859" />
    <path d="M61 83Q100 65 139 83l-13 100H74z" fill="#898989" />
    <path d="M76 94h48v43H76z" fill={color(back ? 'back' : 'chest')} rx="12" />
    <path d="M82 142h36v38H82z" fill={color(back ? 'back' : 'core')} />
    <path d="M74 183h52l9 32H65z" fill="#898989" />
    {[false, true].map(right => <g key={String(right)} transform={right ? 'translate(200 0) scale(-1 1)' : undefined}>
      <ellipse cx="59" cy="93" rx="17" ry="20" fill={color('shoulders')} />
      <path d="M44 106l22 6-9 57-19-4z" fill={color('arms')} />
      <path d="M38 165l19 4-13 50-15-5z" fill={color('arms')} />
      <ellipse cx="34" cy="226" rx="10" ry="14" fill="#898989" />
      <path d="M67 211h28l-5 59H65zM65 275h25l-3 47H67z" fill={color('legs')} />
      <rect x="62" y="320" width="29" height="12" rx="5" fill="#898989" />
    </g>)}
  </svg>;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Part({ position, scale, color = '#747474' }: { position: [number, number, number]; scale: [number, number, number]; color?: string }) {
  return <mesh position={position} scale={scale}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={color} roughness={.58} metalness={.18} /></mesh>;
}
const torsoPoints = [[.29, -.49], [.37, -.34], [.31, -.1], [.29, .05], [.4, .35], [.5, .61], [.46, .77], [.15, .88]].map(([radius, height]) => new THREE.Vector2(radius, height));
function Body({ muscles, back, animate }: BodyProps & { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const color = (muscle: Muscle) => muscles.includes(muscle) ? '#ff6b19' : '#8d8a87';
  useFrame((state, delta) => {
    if (!group.current || !animate) return;
    const target = (back ? Math.PI : 0) + .12 + state.pointer.x * .22;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 6, delta);
    group.current.position.y = Math.sin(state.clock.elapsedTime * .7) * .015;
  });
  return <>
    <ambientLight intensity={1.4} /><directionalLight position={[3, 5, 6]} intensity={2.7} color="#fff0e5" /><directionalLight position={[-3, 2, -3]} intensity={3} color="#ff6b19" /><directionalLight position={[-2, -1, 3]} intensity={1.2} color="#c4b4a9" />
    <group ref={group} rotation={[0, (back ? Math.PI : 0) + .12, 0]}>
      <Part position={[0, 1.68, 0]} scale={[.19, .26, .21]} />
      <Part position={[0, 1.35, 0]} scale={[.12, .14, .12]} />
      <mesh position={[0, .5, 0]} scale={[1, 1, .56]}><latheGeometry args={[torsoPoints, 48]} /><meshStandardMaterial color="#777471" roughness={.58} metalness={.18} /></mesh>
      <Part position={[0, .95, -.225]} scale={[.38, .32, .07]} color={color('back')} />
      {[-1, 1].map(side => <group key={side}>
        <Part position={[side * .225, 1.04, .235]} scale={[.24, .15, .045]} color={color('chest')} />
        {[.7, .54, .38].map(y => <Part key={y} position={[side * .105, y, .165]} scale={[.09, .07, .025]} color={color('core')} />)}
        <Part position={[side * .52, 1.14, 0]} scale={[.18, .2, .19]} color={color('shoulders')} />
        <group position={[side * .61, .78, 0]} rotation={[0, 0, side * .15]}><Part position={[0, 0, 0]} scale={[.135, .3, .14]} color={color('arms')} /></group>
        <Part position={[side * .66, .49, 0]} scale={[.11, .11, .12]} />
        <group position={[side * .69, .24, .035]} rotation={[0, 0, side * .1]}><Part position={[0, 0, 0]} scale={[.10, .25, .11]} color={color('arms')} /></group>
        <Part position={[side * .72, -.07, .045]} scale={[.085, .14, .06]} />
        <Part position={[side * .19, -.43, 0]} scale={[.18, .47, .18]} color={color('legs')} />
        <Part position={[side * .21, -.89, .01]} scale={[.13, .12, .14]} />
        <Part position={[side * .22, -1.23, -.035]} scale={[.12, .32, .13]} color={color('legs')} />
        <Part position={[side * .23, -1.6, .075]} scale={[.12, .09, .22]} />
      </group>)}
    </group>
    <mesh position={[0, -1.74, 0]}><cylinderGeometry args={[.72, .76, .045, 64]} /><meshStandardMaterial color="#4b3b31" metalness={.5} roughness={.3} /></mesh>
  </>;
}

export default function LabBody({ muscles }: { muscles: Muscle[] }) {
  const [back, setBack] = useState(false);
  const capable = useSyncExternalStore(subscribe, hasWebGL, () => false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const container = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '80px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const animate = !reduced && visible && inView;
  const fallback = <StaticBody muscles={muscles} back={back} />;
  return <section ref={container} className="lab-body-card" aria-label="Muscle diagram">
    <div className="lab-card-heading"><span className="lab-body-title"><i />MUSCLE MAP</span><div className="lab-view-toggle" role="group" aria-label="Body view">{[false, true].map(view => <button key={String(view)} aria-pressed={back === view} onClick={() => setBack(view)}>{view ? 'Back' : 'Front'}</button>)}</div></div>
    <div className="lab-body-scene" aria-hidden="true"><span className="lab-body-watermark">PF</span>{capable ? <SceneBoundary fallback={fallback}><Canvas camera={{ position: [0, .14, 6.3], fov: 37 }} dpr={[1, 1.5]} frameloop={animate ? 'always' : 'demand'} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}><Body muscles={muscles} back={back} animate={animate} /></Canvas></SceneBoundary> : fallback}</div>
    <div className="lab-muscles">{muscles.map(muscle => <span key={muscle}><i />{muscleNames[muscle]}</span>)}</div>
    <p className="lab-caption">A simple muscle guide, not an anatomical model.</p>
  </section>;
}
