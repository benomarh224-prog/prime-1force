'use client';

import { useId, useState } from 'react';
import { muscleNames, type Muscle } from '@/lib/lab';
import { muscleMapPaths, preferredMuscleView, type MuscleView } from '@/lib/muscle-map';

export default function LabBody({ muscles, onSelectMuscle }: { muscles: Muscle[]; onSelectMuscle?: (muscle: Muscle) => void }) {
  const id = useId().replaceAll(':', '');
  const focusKey = muscles.join('-');
  const [chosenView, setChosenView] = useState<{ focusKey: string; view: MuscleView } | null>(null);
  const view = chosenView?.focusKey === focusKey ? chosenView.view : preferredMuscleView(muscles);
  const paths = muscleMapPaths[view];
  const image = '/images/primeforge-muscle-' + view + '.webp';
  const visible = muscles.filter(muscle => paths[muscle]);
  const hidden = muscles.filter(muscle => !paths[muscle]);
  const description = (view === 'front' ? 'Front' : 'Rear') + ' muscle illustration. Highlighted: ' + (visible.map(muscle => muscleNames[muscle]).join(', ') || 'none in this view') + '.';

  return <section className="lab-body-card" aria-label="Muscle diagram">
    <div className="lab-card-heading">
      <span className="lab-body-title"><i />MUSCLE MAP</span>
      <div className="lab-view-toggle" role="group" aria-label="Body view">
        {(['front', 'back'] as const).map(option => <button key={option} aria-pressed={view === option} onClick={() => setChosenView({ focusKey, view: option })}>{option === 'front' ? 'Front' : 'Back'}</button>)}
      </div>
    </div>
    <div className="lab-body-scene lab-anatomy-scene">
      <svg className={'lab-anatomy-figure ' + (onSelectMuscle ? 'is-interactive' : '')} viewBox="0 0 853 1280" role={onSelectMuscle ? 'group' : 'img'} aria-label={onSelectMuscle ? 'Select a muscle on the ' + view + ' body view' : description}>
        <defs>
          <filter id={id + '-neutral'} colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0" /></filter>
          <filter id={id + '-orange'} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.6 1.8 0.2 0 0.08 0.24 0.72 0.08 0 0.02 0.03 0.09 0.01 0 0 0 0 0 1 0" /></filter>
          {visible.map(muscle => <clipPath key={muscle} id={id + '-' + muscle}><path d={paths[muscle]} /></clipPath>)}
        </defs>
        <image href={image} width="853" height="1280" preserveAspectRatio="xMidYMid meet" filter={'url(#' + id + '-neutral)'} />
        {visible.map(muscle => <g key={muscle} clipPath={'url(#' + id + '-' + muscle + ')'}>
          <image href={image} width="853" height="1280" preserveAspectRatio="xMidYMid meet" filter={view === 'front' && (muscle === 'core' || muscle === 'legs') ? undefined : 'url(#' + id + '-orange)'} />
        </g>)}
        {onSelectMuscle && (Object.entries(paths) as [Muscle, string][]).map(([muscle, path]) => <path key={muscle} d={path} className="muscle-hit-area" role="button" tabIndex={0} aria-label={'Browse ' + muscleNames[muscle] + ' exercises'} aria-pressed={muscles.includes(muscle)} onClick={() => onSelectMuscle(muscle)} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectMuscle(muscle); }
        }}><title>{muscleNames[muscle] + ' — view exercises'}</title></path>)}
      </svg>
    </div>
    <div className="lab-muscles">{muscles.map(muscle => <span key={muscle}><i />{muscleNames[muscle]}</span>)}</div>
    <p className="lab-caption">{onSelectMuscle ? 'Tap a muscle to see its exercises. You can also use the filter.' : hidden.length ? hidden.map(muscle => muscleNames[muscle]).join(', ') + ' not visible from this side. Switch views to see the focus.' : 'Highlighted areas follow your selected exercise.'}<br />Illustrated guide, not a medical anatomy model.</p>
  </section>;
}
