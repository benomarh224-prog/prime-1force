'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { Exercise } from '@/lib/data';

// Starting with the poster avoids unsolicited motion and unnecessary GIF downloads.
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const [playing, setPlaying] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const animated = playing && Boolean(exercise.gif) && !gifFailed;
  const source = animated ? exercise.gif! : exercise.image;

  return <figure className="exercise-demo">
    <div className={'exercise-demo-frame ' + (animated ? 'is-playing' : '')}>
      {animated || !posterFailed ? <Image
        key={source} unoptimized src={source} width={640} height={480}
        loading={animated ? 'eager' : 'lazy'}
        alt={(animated ? 'Animated demonstration: ' : 'Exercise preview: ') + exercise.name}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          if (animated) { setGifFailed(true); setPlaying(false); }
          else setPosterFailed(true);
        }}
      /> : <p>Preview unavailable. Follow the instructions below.</p>}
      {loading && <span className="exercise-demo-loading" role="status">Loading demonstration…</span>}
    </div>
    {exercise.gif && <button className="exercise-demo-control" aria-label={(animated ? 'Pause' : gifFailed ? 'Retry' : 'Play') + ' demonstration: ' + exercise.name} aria-pressed={animated} onClick={() => {
      const next = !animated;
      setGifFailed(false);
      setPlaying(next);
      setLoading(next);
    }}>{animated ? <Pause size={17} /> : gifFailed ? <RotateCcw size={17} /> : <Play size={17} />}<span>{animated ? 'Pause demo' : gifFailed ? 'Retry demo' : 'Play GIF demo'}</span><small>{animated ? 'GIF • playing' : 'Step-by-step motion'}</small></button>}
    {gifFailed && <figcaption role="status">The animation could not load. You can still follow the written steps.</figcaption>}
  </figure>;
}
