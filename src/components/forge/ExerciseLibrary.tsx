'use client';

import { Search } from 'lucide-react';
import { exercises } from '@/lib/data';
import { ExerciseDemo } from '@/components/forge/ExerciseDemo';
import LabBody from '@/components/forge/LabBody';
import { muscleNames } from '@/lib/lab';
import { exerciseMatchesMuscle, musclesForFilter } from '@/lib/exercise-guide';

const muscleGroups = [...new Set([...exercises.map(exercise => exercise.muscleGroup), 'Arms', 'Core'])];

export function ExerciseLibrary({ muscle, onMuscleChange, query, onQueryChange }: { muscle: string; onMuscleChange: (muscle: string) => void; query: string; onQueryChange: (query: string) => void }) {
  const search = query.trim().toLowerCase();
  const filtered = exercises.filter(exercise => exerciseMatchesMuscle(exercise, muscle)
    && `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase().includes(search));

  return <section id="exercise-library" className="exercise-library" aria-labelledby="exercise-library-title">
    <div className="exercise-library-heading"><div><p className="lab-eyebrow">THE MOVEMENT LIBRARY</p><h2 id="exercise-library-title">See it. Learn it. Lift.</h2><p>Your original exercises, with GIF demos and clear instructions.</p></div><span className="exercise-library-count" role="status">{filtered.length} / {exercises.length} exercises</span></div>
    <div className="exercise-library-explorer"><div className="exercise-library-body"><LabBody muscles={musclesForFilter(muscle)} onSelectMuscle={selected => { onQueryChange(''); onMuscleChange(muscleNames[selected]); }} /><button className="exercise-show-all" onClick={() => { onQueryChange(''); onMuscleChange('all'); }}>Show all exercises</button></div><div className="exercise-library-results">
    <div className="exercise-library-filters">
      <label className="exercise-search"><Search size={18} /><span className="sr-only">Search exercises</span><input type="search" placeholder="Find an exercise…" value={query} onChange={event => onQueryChange(event.target.value)} /></label>
      <label className="exercise-muscle-filter"><span>Muscle group</span><select value={muscle} onChange={event => onMuscleChange(event.target.value)}><option value="all">All muscles</option>{muscleGroups.map(group => <option key={group} value={group}>{group}</option>)}</select></label>
    </div>
    <div className="exercise-library-grid">{filtered.map(exercise => <article key={exercise.id} className="exercise-library-card">
      <div className="exercise-library-card-heading"><span>{exercise.muscleGroup}</span><h3>{exercise.name}</h3><p>{exercise.equipment}</p><div className="exercise-prescription"><span>3 sets</span><span>8–12 reps</span></div></div>
      <ExerciseDemo exercise={exercise} />
      {exercise.tips.length > 0 && <p className="exercise-form-tip"><strong>Form tip:</strong> {exercise.tips[0]}</p>}
      <details><summary>How to do it</summary><ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol></details>
    </article>)}</div>
    {filtered.length === 0 && <div className="exercise-library-empty"><p>{muscle === 'Core' && !query ? 'No core GIF demos in your original library yet. Choose another muscle group.' : 'No exercises match your search.'}</p><button onClick={() => { onQueryChange(''); onMuscleChange('all'); }}>Clear filters</button></div>}
    <p className="exercise-prescription-note">Suggested starting structure, not a personalized prescription. Your active session may use different sets and reps.</p>
    </div></div>
  </section>;
}
