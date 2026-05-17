# TODO: Fix WebGL “Too many active WebGL contexts”

- [ ] Update `src/components/scanner/ThreeAnimationsClient.tsx` to stop creating 3 WebGL renderers (particles/ring/grid). 
- [ ] Implement a single `<ThreeCanvas>` / single `THREE.WebGLRenderer` approach (preferred) so only one WebGL context is created.
- [ ] Verify disposal: cancel RAF, disconnect IntersectionObserver, and dispose geometries/materials/renderer.
- [ ] Re-test in browser devtools: confirm the WebGL context warning disappears.


