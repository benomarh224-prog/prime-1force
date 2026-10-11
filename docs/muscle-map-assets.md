# Replacement muscle-map artwork

Mode: built-in image generation, with the user-supplied mannequin as the edit target/reference. No external model or API credentials were added. Original generated PNGs remain in the task's Codex generated-images folder.

## Saved assets

- `public/images/primeforge-muscle-front.webp` — transparent front illustration, optimized to 853 × 1280.
- `public/images/primeforge-muscle-back.webp` — matching transparent rear illustration, optimized to 853 × 1280.

## Final prompts

Front: Use case: background-extraction. Asset type: website muscle-map figure. Image 1 is the EDIT TARGET. Remove ONLY the white background, producing a genuine transparent alpha cutout. Keep the entire exact faceless graphite muscular mannequin, all detailed muscular anatomy, metallic graphite materials, black shorts, pose, orange core/thigh/calf highlights and thin orange rim light unchanged. Preserve its original portrait framing and proportions, fully visible head, hands, toes with similar small margins. No text, labels, arrows, props, shadows on a background, or added objects. This is a clean extraction, not a redesign.

Rear: Use case: stylized-concept. Asset type: website rear-view muscle-map figure. Image 1 is a STYLE AND CHARACTER REFERENCE ONLY. Generate the SAME faceless graphite muscular mannequin seen directly FROM BEHIND, symmetrical full-body rear view, relaxed arms slightly away from torso, fingers naturally down, feet flat. Match the precise athletic muscular proportions, brushed charcoal/graphite material, sculpted muscle detail, black close-fit shorts, subtle orange rim light of the reference. All muscles neutral charcoal gray including legs/back; no colored highlights except subtle edge rim lighting. Portrait 2:3, centered body filling nearly entire height with small top/bottom margins, full head/hands/feet visible. Genuinely transparent background. No text, labels, arrows, pedestals, floor shadows, extra objects. Anatomically plausible illustration, not a medical diagram.

## UI integration

The procedural WebGL mannequin was replaced by 3D-style raster illustrations. These are front/rear views, not a rotatable 3D mesh. SVG clipping and color filters show broad focus regions following the selected exercise; the original front orange shading is retained for core/legs. Rear-focused exercises choose the rear view automatically, while the user can still switch sides. Hidden groups are explicitly described instead of highlighting unrelated areas.

The figure's silhouette, head, shorts, hands and feet are never recolored as exercise focus areas. This is an illustrative training guide, not medically precise muscle segmentation. No workout data or account behavior was changed.
