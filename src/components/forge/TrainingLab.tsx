'use client';

import { useEffect, useState } from 'react';
import LabBody from '@/components/forge/LabBody';
import { useSession } from 'next-auth/react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Timer } from 'lucide-react';
import { buildLabPlan, equipmentNames, goalNames, localDateKey, type LabEquipment, type LabGoal, type LabMinutes } from '@/lib/lab';
import { useLabStore } from '@/lib/lab-store';
import { useAppStore, type WorkoutLog } from '@/lib/store';

export function TrainingLab() {
  const { status } = useSession();
  const { config, draft, setConfig, start, updateSet, cancel, finish, replaceLog } = useLabStore();
  const navigate = useAppStore(state => state.navigate);
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [restUntil, setRestUntil] = useState(0);
  const [now, setNow] = useState(0);
  const plan = draft?.plan ?? buildLabPlan(config);
  const activeIndex = Math.min(selected, plan.movements.length - 1);
  const movement = plan.movements[activeIndex];
  const rest = Math.max(0, Math.ceil((restUntil - now) / 1000));
  const completedSets = draft ? Object.values(draft.sets).flat().filter(set => set.done).length : 0;

  useEffect(() => {
    if (!restUntil) return;
    const interval = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= restUntil) setRestUntil(0);
    }, 500);
    return () => window.clearInterval(interval);
  }, [restUntil]);

  const save = async () => {
    if (!draft || !completedSets || saving) return;
    const log: WorkoutLog = {
      id: draft.id, date: localDateKey(), name: draft.plan.name ?? goalNames[draft.plan.config.goal] + ' · ' + equipmentNames[draft.plan.config.equipment],
      duration: Math.round((Date.now() - draft.startedAt) / 60000), notes: '', completed: true,
      exercises: draft.plan.movements.map(item => ({
        exerciseId: item.id, exerciseName: item.name,
        sets: draft.sets[item.id].filter(set => set.done).map(({ reps, weight }) => ({ reps, weight })),
      })).filter(item => item.sets.length),
    };
    setSaving(true);
    finish(log);
    setRestUntil(0);
    setConfirmEnd(false);
    setNotice('Session saved on this device.');
    if (status === 'authenticated') {
      try {
        const response = await fetch('/api/workout-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workout: log }) });
        const data = await response.json();
        if (response.ok && data.success && data.workout && data.persistence !== 'disabled') {
          replaceLog(log.id, data.workout);
          useAppStore.getState().upsertWorkoutLog(data.workout);
          setNotice('Session saved and synced to your account.');
        } else setNotice('Session saved on this device. Account sync is unavailable.');
      } catch { setNotice('Session saved on this device. Account sync is unavailable.'); }
    }
    setSaving(false);
  };

  const startSession = () => {
    start();
    setNotice('');
    setSelected(0);
    window.requestAnimationFrame(() => document.getElementById('session')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
  };

  return <div className="lab-page lab-home">
    {notice && <div className="lab-notice" role="status"><Check size={18} /><span>{notice}</span><button onClick={() => navigate('dashboard')}>View progress <ArrowRight size={15} /></button></div>}
    <section className="lab-hero" aria-label="Build your workout">
      <div className="lab-hero-copy">
        <div className="lab-intro"><p className="lab-eyebrow"><span className="lab-live-dot" /> LESS FRICTION. MORE PROGRESS.</p><h1>YOUR BODY.<br /><span>YOUR RULES.</span></h1><p>A clear session. Built around your life.<br />Choose your setup. We’ll bring the structure.</p></div>
        <section className="lab-config lab-card">
          <div className="lab-card-heading"><h2>{draft ? 'Your session is ready' : 'Make it yours'}</h2><span className="lab-config-index">01 — SETUP</span></div>
          {draft ? <p className="lab-active-config">{goalNames[plan.config.goal]} · {plan.config.minutes} min · {equipmentNames[plan.config.equipment]}</p> : <>
          <fieldset disabled={saving}><legend>Your goal</legend><div className="lab-options">{(['strength', 'muscle', 'fitness'] as LabGoal[]).map(goal => <button key={goal} aria-pressed={config.goal === goal} onClick={() => setConfig({ goal })}>{goalNames[goal]}</button>)}</div></fieldset>
          <fieldset disabled={Boolean(draft) || saving}><legend>Time available</legend><div className="lab-options">{([20, 35, 50] as LabMinutes[]).map(minutes => <button key={minutes} aria-pressed={config.minutes === minutes} onClick={() => setConfig({ minutes })}>{minutes} min</button>)}</div></fieldset>
          <fieldset disabled={saving}><legend>Equipment</legend><div className="lab-options">{(['gym', 'dumbbells', 'bodyweight'] as LabEquipment[]).map(equipment => <button key={equipment} aria-pressed={config.equipment === equipment} onClick={() => setConfig({ equipment })}>{equipmentNames[equipment]}</button>)}</div></fieldset>
          </>}
          <div className="lab-plan-summary"><span><strong>{plan.movements.length}</strong> exercises</span><span><strong>{plan.sets}</strong> sets each</span><span><strong>{plan.rest}s</strong> rest</span></div>
          <div className="lab-session-actions">{draft ? <button className="lab-primary" onClick={() => document.getElementById('session')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Continue session <ArrowDown size={19} /></button> : <button className="lab-primary" disabled={saving} onClick={startSession}>Let’s get to work <ArrowUpRight size={20} /></button>}<p className="lab-caption">No account. No friction. Just your next session.</p></div>
        </section>
      </div>
      <div className="lab-body-column"><LabBody muscles={movement.muscles} /><div className="lab-focus"><span className="lab-eyebrow">IN FOCUS / {String(activeIndex + 1).padStart(2, '0')}</span><strong>{movement.name}</strong><p>{plan.sets} sets · {plan.reps} reps · {plan.rest}s rest</p></div></div>
    </section>
    <section id="session" className="lab-session-section" aria-label="Your session exercises">
      <div className="lab-session-intro"><p className="lab-eyebrow">02 — THE WORK</p><h2>{draft ? <>ONE SET.<br />AT A TIME.</> : <>A PLAN.<br />NOT A GUESS.</>}</h2><p>{draft ? 'Log what you lift. Take your rest. Keep moving.' : 'Your exercises, in order. Select a movement to see the cues and muscles involved.'}</p><div className="lab-session-meta"><span>{goalNames[plan.config.goal]}</span><span>{equipmentNames[plan.config.equipment]}</span></div></div>
      <div className="lab-workout-column">
        <section className="lab-card lab-exercises">
          <div className="lab-card-heading"><h2>{draft ? 'Log your sets' : 'Your session'}</h2><span className="lab-muted">{draft ? completedSets + ' sets done' : plan.config.minutes + ' min target'}</span></div>
          <div className="lab-exercise-list">{plan.movements.map((item, index) => {
            const isSelected = index === activeIndex;
            const done = draft?.sets[item.id].filter(set => set.done).length ?? 0;
            return <div key={item.id} className={'lab-exercise ' + (isSelected ? 'is-selected' : '')}>
              <button className="lab-exercise-trigger" aria-expanded={isSelected} aria-controls={'details-' + item.id} onClick={() => setSelected(index)}>
                <span className="lab-exercise-number">{draft && done === plan.sets ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span>
                <span><strong>{item.name}</strong><small>{draft ? done + '/' + plan.sets + ' sets done' : plan.sets + ' sets · ' + plan.reps + ' reps'}</small></span><ChevronDown size={17} />
              </button>
              {isSelected && <div id={'details-' + item.id} className="lab-exercise-details">
                <ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol>
                {draft && <div className="lab-sets"><div className={'lab-set-labels ' + (config.equipment === 'bodyweight' ? 'is-bodyweight' : '')}><span>Set</span><span>Reps</span>{config.equipment !== 'bodyweight' && <span>Kg</span>}<span>Done</span></div>{draft.sets[item.id].map((set, setIndex) => <div key={setIndex} className={'lab-set-row ' + (config.equipment === 'bodyweight' ? 'is-bodyweight' : '')}>
                  <span>{setIndex + 1}</span>
                  <input type="number" min="1" max="200" inputMode="numeric" aria-label={item.name + ' set ' + (setIndex + 1) + ' reps'} value={set.reps} onChange={event => updateSet(item.id, setIndex, { reps: Math.max(1, Math.min(200, Number(event.target.value) || 1)) })} />
                  {config.equipment !== 'bodyweight' && <input type="number" min="0" max="1000" step=".5" inputMode="decimal" aria-label={item.name + ' set ' + (setIndex + 1) + ' weight in kg'} value={set.weight} onChange={event => updateSet(item.id, setIndex, { weight: Math.max(0, Math.min(1000, Number(event.target.value) || 0)) })} />}
                  <button className="lab-done" aria-label={item.name + ' set ' + (setIndex + 1) + ' complete'} aria-pressed={set.done} onClick={() => {
                    updateSet(item.id, setIndex, { done: !set.done });
                    if (!set.done) { const time = Date.now(); setNow(time); setRestUntil(time + plan.rest * 1000); }
                  }}>{set.done && <Check size={17} />}</button>
                </div>)}</div>}
              </div>}
            </div>;
          })}</div>
          {draft ? <div className="lab-session-actions">
            {rest > 0 && <div className="lab-rest" role="timer" aria-label="Rest time remaining"><Timer size={17} /><span>Rest · {rest}s</span><button onClick={() => setRestUntil(0)}>Skip</button></div>}
            <button className="lab-primary" disabled={!completedSets || saving} onClick={save}>Finish & save {completedSets > 0 && <span>({completedSets} sets)</span>}<Check size={17} /></button>
            {confirmEnd ? <div className="lab-discard"><p>Discard this unfinished session?</p><button onClick={() => { cancel(); setRestUntil(0); setConfirmEnd(false); }}>Discard</button><button onClick={() => setConfirmEnd(false)}>Keep training</button></div> : <button className="lab-text-button" onClick={() => setConfirmEnd(true)}>Discard session</button>}
          </div> : null}
        </section>
        <p className="lab-safety">Start with a light warm-up. Choose a comfortable load and stop if you feel pain. Time estimates vary with your pace.</p>
      </div>
    </section>
  </div>;
}
