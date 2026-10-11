# Reference-style Prime Forge assets

Generated with the built-in image-generation tool. The supplied screenshot was used only as a style/composition reference. These are separate production images, not a flattened screenshot of the website.

## Saved assets and prompts

Shared constraints: dark industrial gym, cinematic orange practical/rim lighting, black training clothes, realistic anatomy, no text, logos, UI, borders or watermarks.

- `public/images/primeforge-hero-ref.webp`: panoramic 16:9 photograph of an adult muscular athlete seated on the right, looking down and adjusting wrist wraps, barbell in the foreground; left half nearly black negative space for the headline.
- `public/images/primeforge-push-ref.webp`: side-view push-up with bent arms and visible chest/shoulder detail; lower third dark for copy.
- `public/images/primeforge-pull-ref.webp`: rear view of an adult athlete performing a pull-up, bent elbows and detailed back/shoulders; lower third dark.
- `public/images/primeforge-legs-ref.webp`: three-quarter side view of a barbell back squat, bar on upper back, loaded plates, bent knees and visible thighs.
- `public/images/primeforge-coach-ref.webp`: panoramic 3:1 stylized concept, polished android profile at far left with orange circuit rim light, glowing orange holographic sphere right of center with orbit lines/nodes; empty dark center-left for HTML copy.

Optimized WebP assets total about 350 KiB. Original PNGs are preserved in the Codex generated-images folder for this task.

## Design decisions

Black/orange palette and section order follow the supplied reference. The weekly card and lower metrics use actual recorded training data; community statistics and success claims were not invented. Training cards open working three-exercise sessions. The pre-existing AI coach service and account flow are retained, not reconfigured.

## Checks

`node scripts/verify-training-splits.cjs` tests all three plans and protects unfinished sessions. The production build includes TypeScript checks. Browser checks covered desktop/mobile rendering, card navigation, set completion and the rest timer. Temporary verification sessions were discarded without adding workout history.
