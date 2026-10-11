'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { exercises } from '@/lib/data';
import { ExerciseDemo } from '@/components/forge/ExerciseDemo';

const muscleGroups = [...new Set(exercises.map(exercise => exercise.muscleGroup))];

export function ExerciseLibrary() {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('all');
  const search = query.trim().toLowerCase();
  const filtered = exercises.filter(exercise => (muscle === 'all' || exercise.muscleGroup === muscle)
    && `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase().includes(search));

  return <section id="exercise-library" className="exercise-library" aria-labelledby="exercise-library-title">
    <div className="exercise-library-heading"><div><p className="lab-eyebrow">THE MOVEMENT LIBRARY</p><h2 id="exercise-library-title">See it. Learn it. Lift.</h2><p>Your original exercises, with GIF demos and clear instructions.</p></div><span className="exercise-library-count" role="status">{filtered.length} / {exercises.length} exercises</span></div>
    <div className="exercise-library-filters">
      <label className="exercise-search"><Search size={18} /><span className="sr-only">Search exercises</span><input type="search" placeholder="Find an exercise…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="exercise-muscle-filter"><span>Muscle group</span><select value={muscle} onChange={event => setMuscle(event.target.value)}><option value="all">All muscles</option>{muscleGroups.map(group => <option key={group} value={group}>{group}</option>)}</select></label>
    </div>
    <div className="exercise-library-grid">{filtered.map(exercise => <article key={exercise.id} className="exercise-library-card">
      <div className="exercise-library-card-heading"><span>{exercise.muscleGroup}</span><h3>{exercise.name}</h3><p>{exercise.equipment}</p></div>
      <ExerciseDemo exercise={exercise} />
      <details><summary>How to do it</summary><ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol>{exercise.tips.length > 0 && <p className="exercise-form-tip"><strong>Form tip:</strong> {exercise.tips[0]}</p>}</details>
    </article>)}</div>
    {filtered.length === 0 && <div className="exercise-library-empty"><p>No exercises match your search.</p><button onClick={() => { setQuery(''); setMuscle('all'); }}>Clear filters</button></div>}
  </section>;
}
