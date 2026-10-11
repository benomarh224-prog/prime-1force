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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const scopedRequire = name => {
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
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
console.log('All training split checks passed. No user data was changed.');
