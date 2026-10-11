// Isolated regression checks: no browser storage, account requests, or user data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
const root = path.resolve(__dirname, '..');
const storage = new Map();
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const scopedRequire = name => {
    if (name.startsWith('@/')) {
      const candidate = 'src/' + name.slice(2);
      return load(candidate + (fs.existsSync(path.join(root, candidate + '.ts')) ? '.ts' : '.tsx'));
    }
    if (name === 'zustand/middleware') {
      const { persist, createJSONStorage } = require(name);
      return { persist: (creator, options) => persist(creator, { ...options, storage: createJSONStorage(() => localStorage) }) };
    }
    return require(name);
  };
  const scope = vm.createContext({ console, crypto: require('node:crypto').webcrypto, localStorage, Date, setTimeout, clearTimeout });
  vm.runInContext('(function(require,module,exports){' + source + '\n})', scope, { filename })(scopedRequire, module, module.exports);
  return module.exports;
}
const { trainingSplits, buildSplitPlan } = load('src/lib/splits.ts');
const { useLabStore } = load('src/lib/lab-store.ts');
assert.equal(trainingSplits.length, 3);
for (const split of trainingSplits) {
  const plan = buildSplitPlan(split.id);
  assert.equal(plan.movements.length, 3);
  assert.equal(new Set(plan.movements.map(item => item.id)).size, 3);
  assert.ok(plan.movements.every(item => item.steps.length > 0));
  useLabStore.getState().start(plan);
  const draft = useLabStore.getState().draft;
  assert.equal(draft.plan.name, split.label + ' session');
  assert.equal(Object.values(draft.sets).flat().length, 9);
  useLabStore.getState().start(buildSplitPlan('legs'));
  assert.equal(useLabStore.getState().draft.id, draft.id, 'An unfinished session must not be replaced');
  useLabStore.getState().setConfig({ equipment: 'bodyweight' });
  assert.equal(useLabStore.getState().config.equipment, 'gym');
  const movement = plan.movements[0].id;
  useLabStore.getState().updateSet(movement, 0, { reps: 10, weight: 20, done: true });
  assert.equal(useLabStore.getState().draft.sets[movement][0].done, true);
  assert.equal(draft.sets[movement][0].done, false, 'Set updates must be immutable');
  assert.equal(JSON.parse(storage.get('primeforge-lab-v1')).state.draft.sets[movement][0].done, true);
  useLabStore.getState().cancel();
  assert.equal(useLabStore.getState().draft, null);
  console.log(split.label + ': plan, tracking, draft preservation and cancellation passed');
}
assert.equal(useLabStore.getState().history.length, 0);
const { muscleMapPaths, preferredMuscleView } = load('src/lib/muscle-map.ts');
assert.equal(preferredMuscleView(['legs', 'core']), 'front');
assert.equal(preferredMuscleView(['chest', 'arms']), 'front');
assert.equal(preferredMuscleView(['back', 'arms']), 'back');
assert.equal(muscleMapPaths.front.back, undefined, 'Do not highlight a back muscle on a front illustration');
assert.equal(muscleMapPaths.back.chest, undefined, 'Do not highlight chest on a rear illustration');
for (const muscle of ['chest', 'back', 'shoulders', 'arms', 'core', 'legs']) {
  assert.ok(muscleMapPaths.front[muscle] || muscleMapPaths.back[muscle], muscle + ' must have a visible focus region');
}
console.log('Muscle map: focus regions and front/rear selection passed');
const { exercises } = load('src/lib/data.ts');
assert.equal(exercises.length, 11, 'Restore the complete original exercise catalog');
assert.equal(new Set(exercises.map(exercise => exercise.id)).size, 11);
for (const exercise of exercises) {
  assert.ok(exercise.gif.startsWith('https://static.exercisedb.dev/media/') && exercise.gif.endsWith('.gif'));
  assert.ok(fs.existsSync(path.join(root, 'public', exercise.image)), exercise.name + ' has a local fallback poster');
  assert.ok(exercise.steps.length > 0, exercise.name + ' has instructions');
}
// Contrast checks for the new reading surfaces and interactive orange buttons.
function luminance(hex) {
  const values = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
for (const [foreground, background] of [['182333', 'f4f6f8'], ['526172', 'ffffff'], ['ffffff', 'c54b0d'], ['a33b08', 'fff1e8']]) {
  const levels = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const ratio = (levels[0] + .05) / (levels[1] + .05);
  assert.ok(ratio >= 4.5, `${foreground} on ${background} must meet normal-text contrast`);
  console.log(`Contrast ${foreground}/${background}: ${ratio.toFixed(2)}:1 passed`);
}
console.log('Exercise catalog: all 11 original GIF mappings, fallback posters and instructions passed');
const { mergeCompletedLogs, getTrainingWeek, suggestTodayPlan } = load('src/lib/training-overview.ts');
const sampleLog = (id, date, name = 'PUSH session', completed = true) => ({
  id, date, name, completed, duration: 20, notes: '',
  exercises: [{ exerciseId: 'bench-press', exerciseName: 'Barbell Bench Press', sets: [{ reps: 10, weight: 20 }] }],
});
const sampleLogs = [sampleLog('a', '2026-10-05'), sampleLog('b', '2026-10-05'), sampleLog('c', '2026-10-11'), sampleLog('old', '2026-10-04'), sampleLog('future', '2026-10-12')];
const merged = mergeCompletedLogs(sampleLogs, [sampleLog('a', '2026-10-05'), sampleLog('incomplete', '2026-10-06', 'PULL session', false)]);
assert.equal(merged.length, 5, 'Synced and device logs should not double count');
assert.equal(mergeCompletedLogs([sampleLog('same', '2026-10-05')], [sampleLog('same', '2026-10-05', 'PUSH session', false)]).length, 0);
const week = getTrainingWeek(merged, new Date(2026, 9, 11));
assert.equal(week.days[0].key, '2026-10-05');
assert.equal(week.days[6].key, '2026-10-11');
assert.equal(week.sessions, 3);
assert.equal(week.sets, 3);
assert.equal(week.days[0].sessions, 2);
assert.equal(week.days[6].isToday, true);
assert.equal(getTrainingWeek([], new Date(2026, 9, 7)).sessions, 0);
assert.equal(getTrainingWeek([sampleLog('future', '2026-10-09')], new Date(2026, 9, 7)).sessions, 0);
assert.equal(new Set(getTrainingWeek([], new Date(2026, 10, 1)).days.map(day => day.key)).size, 7, 'Keep distinct local days around daylight-saving changes');
const gymConfig = { goal: 'strength', equipment: 'gym', minutes: 35 };
assert.equal(suggestTodayPlan(gymConfig, []).name, 'PUSH session');
assert.equal(suggestTodayPlan(gymConfig, [sampleLog('x', '2026-10-10')]).name, 'PULL session');
assert.equal(suggestTodayPlan(gymConfig, [sampleLog('x', '2026-10-10', 'PULL session')]).name, 'LEGS session');
assert.equal(suggestTodayPlan(gymConfig, [sampleLog('x', '2026-10-10', 'LEGS session')]).name, 'PUSH session');
assert.equal(suggestTodayPlan({ ...gymConfig, equipment: 'bodyweight', minutes: 20 }, []).movements.length, 3);
const { exerciseMatchesMuscle, musclesForFilter } = load('src/lib/exercise-guide.ts');
assert.equal(exercises.filter(exercise => exerciseMatchesMuscle(exercise, 'Arms')).length, 2);
assert.equal(exercises.filter(exercise => exerciseMatchesMuscle(exercise, 'Back')).length, 3);
assert.equal(exercises.filter(exercise => exerciseMatchesMuscle(exercise, 'Core')).length, 0, 'Do not invent GIFs for missing core movements');
assert.equal(musclesForFilter('Biceps')[0], 'arms');
assert.equal(musclesForFilter('all').length, 0);
console.log('Today workout, weekly progress, duplicate protection and body-to-exercise filters passed');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const LabBody = load('src/components/forge/LabBody.tsx').default;
const frontMarkup = renderToStaticMarkup(React.createElement(LabBody, { muscles: ['chest'], onSelectMuscle: () => {} }));
assert.ok(frontMarkup.includes('role="group"'), 'Interactive SVG must expose a group, not hide controls inside an image');
assert.ok(frontMarkup.includes('aria-label="Browse Chest exercises"'));
assert.ok(frontMarkup.includes('tabindex="0"'), 'Muscle regions must be keyboard accessible');
assert.ok(!frontMarkup.includes('aria-label="Browse Back exercises"'), 'Back selection belongs on the rear illustration');
const backMarkup = renderToStaticMarkup(React.createElement(LabBody, { muscles: ['back'], onSelectMuscle: () => {} }));
assert.ok(backMarkup.includes('aria-label="Browse Back exercises"'));
const { ExerciseLibrary } = load('src/components/forge/ExerciseLibrary.tsx');
const armsMarkup = renderToStaticMarkup(React.createElement(ExerciseLibrary, { muscle: 'Arms', onMuscleChange: () => {}, query: '', onQueryChange: () => {} }));
assert.equal((armsMarkup.match(/class="exercise-library-card"/g) || []).length, 2);
assert.ok(armsMarkup.includes('Play demonstration: Machine Bicep Curl'));
assert.ok(armsMarkup.includes('Play demonstration: Cable Triceps Pushdown'));
assert.ok(armsMarkup.includes('Form tip:'));
assert.ok(armsMarkup.includes('3 sets') && armsMarkup.includes('8–12 reps'));
const coreMarkup = renderToStaticMarkup(React.createElement(ExerciseLibrary, { muscle: 'Core', onMuscleChange: () => {}, query: '', onQueryChange: () => {} }));
assert.ok(coreMarkup.includes('No core GIF demos in your original library yet.'));
const { WeeklyTraining } = load('src/components/forge/WeeklyTraining.tsx');
const weeklyMarkup = renderToStaticMarkup(React.createElement(WeeklyTraining, { logs: [], goal: 5 }));
assert.equal((weeklyMarkup.match(/no recorded sessions|upcoming/g) || []).length, 7);
console.log('Rendered UI: front/rear accessible muscle controls, filtered GIF cards, form tips and seven-day summary passed');
console.log('All training split checks passed. No user data was changed.');
