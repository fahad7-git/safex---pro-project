"use client";

import { useEffect, useMemo, useRef } from 'react';
import * as THREE_NS from 'three';
const THREE = THREE_NS as any;

type Variant = 'particles' | 'ring' | 'grid';

function usePrefersReducedMotion() {
  const value = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const set = () => {
      value.current = mq.matches;
    };
    set();
    mq.addEventListener?.('change', set);
    return () => mq.removeEventListener?.('change', set);
  }, []);
  return value;
}

function ThreeCanvas({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reducedMotionRef = usePrefersReducedMotion();

  const seed = useMemo(() => {

    // deterministic-ish seed per variant
    const base = variant === 'particles' ? 1337 : variant === 'ring' ? 4242 : 9001;
    return base;
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = mountRef.current;
    if (!canvas || !mount) return;
    const mountEl = mount;


    let raf = 0;
    let alive = true;
    let disposed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible) start();
        else stop();
      },
      { threshold: 0.1 }
    );
    observer.observe(mount);

    // THREE init
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, variant === 'grid' ? 6 : 7);

    // Lighting (mostly for ring)
    const lightA = new THREE.PointLight(0x59c3ff, 1.2, 40);
    lightA.position.set(3, 3, 6);
    scene.add(lightA);

    const lightB = new THREE.PointLight(0x10b981, 0.9, 40);
    lightB.position.set(-3, -2, 6);
    scene.add(lightB);

    const group = new THREE.Group();
    scene.add(group);

    // Helpers
    const random = (() => {
      let t = seed;
      return () => {
        // simple LCG
        t = (t * 1664525 + 1013904223) % 4294967296;
        return t / 4294967296;
      };
    })();

    // Variant setup
    let geom: any = null;
    let mat: any = null;
    let mesh: any = null;

    if (variant === 'particles') {
      // Particle nebula
      const count = 1800;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // radius distribution
        const r = Math.pow(random(), 0.4) * 5.2;
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.cos(phi);
        positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // mix neon blues/greens
        const c = random();
        const rC = c < 0.5 ? 0.16 : 0.23;
        const gC = c < 0.5 ? 0.74 : 0.32;
        const bC = c < 0.5 ? 1.0 : 0.86;

        colors[i3] = rC;
        colors[i3 + 1] = gC;
        colors[i3 + 2] = bC;
      }

      geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      mat = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      mesh = new THREE.Points(geom, mat);
      group.add(mesh);
    } else if (variant === 'ring') {
      // Holographic torus ring
      const geometry = new THREE.TorusGeometry(2.2, 0.28, 18, 120);
      geom = geometry;
      mat = new THREE.MeshStandardMaterial({
        color: 0x59c3ff,
        emissive: 0x1d4ed8,
        emissiveIntensity: 1.2,
        metalness: 0.15,
        roughness: 0.25,
        transparent: true,
        opacity: 0.7,
      });
      mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      const glowGeom = new THREE.TorusGeometry(2.2, 0.34, 18, 120);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.28 });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      group.add(glow);

      // animate two rings
      const setRingRot = () => {
        group.rotation.x = 0.6;
        group.rotation.z = 0.0;
      };
      setRingRot();

      // store glow in userData
      (group as any).__glow = glow;
    } else {
      // grid telemetry
      const width = 18;
      const height = 10;
      const pts: number[] = [];
      const cols: number[] = [];
      const lines: number[] = [];

      // base positions
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const xf = (x - width / 2) * 0.28;
          const yf = (y - height / 2) * 0.22;
          const zf = -((x + y) % 7) * 0.02;
          pts.push(xf, yf, zf);

          // color gradient
          const n = x / width;
          cols.push(0.2 + 0.2 * n, 0.8, 1.0);

          // a subset of grid lines
          if (x % 2 === 0 && y < height - 1) {
            const xf2 = xf;
            const yf2 = ((y + 1) - height / 2) * 0.22;
            lines.push(xf, yf, zf, xf2, yf2, zf - 0.02);
          }
          if (y % 2 === 0 && x < width - 1) {
            const xf2 = ((x + 1) - width / 2) * 0.28;
            const yf2 = yf;
            lines.push(xf, yf, zf, xf2, yf2, zf - 0.02);
          }
        }
      }

      geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
      geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));

      mat = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geom, mat);
      group.add(points);
      mesh = points;

      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lines), 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x59c3ff, transparent: true, opacity: 0.18 });
      const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
      group.add(lineMesh);

      // store references for update
      (group as any).__lineMesh = lineMesh;
      (group as any).__points = points;
    }

    function resize() {
      if (!mount) return;
      const rect = mount.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const start = () => {
      if (!alive || disposed) return;
      if (reducedMotionRef.current) return; // static (no raf)
      if (raf) return;

      const t0 = performance.now();
      const tick = () => {
        if (!alive || disposed) return;
        const t = (performance.now() - t0) / 1000;

        // subtle camera motion
        if (variant === 'particles') {
          group.rotation.y = t * 0.22;
          group.rotation.x = Math.sin(t * 0.45) * 0.08;
          // twirl particles by scaling whole group
          group.scale.setScalar(1 + Math.sin(t * 0.6) * 0.03);

          const points = mesh as any;
          const pos = points.geometry.getAttribute('position') as any;
          // animate a small offset based on time; keep light
          for (let i = 0; i < pos.count; i += 40) {
            const ix = i * 3;
            const x = (pos.array[ix] as number) * (1 + Math.sin(t * 0.7 + i) * 0.002);
            const y = (pos.array[ix + 1] as number) * (1 + Math.cos(t * 0.6 + i) * 0.002);
            const z = (pos.array[ix + 2] as number) * (1 + Math.sin(t * 0.5 + i) * 0.002);
            pos.array[ix] = x;
            pos.array[ix + 1] = y;
            pos.array[ix + 2] = z;
          }
          pos.needsUpdate = true;
        } else if (variant === 'ring') {
          const glow = (group as any).__glow as any | undefined;
          group.rotation.y = t * 0.45;
          group.rotation.x = 0.55 + Math.sin(t * 0.8) * 0.12;
          if (glow) glow.rotation.y = -t * 0.8;
          camera.position.z = 7 + Math.sin(t * 0.5) * 0.35;
        } else {
          const points = (group as any).__points as any | undefined;
          const lineMesh = (group as any).__lineMesh as any | undefined;
          group.rotation.z = Math.sin(t * 0.22) * 0.1;

          if (points) {
            const pos = points.geometry.getAttribute('position') as any;
            // animate z wave for a subset
            for (let i = 0; i < pos.count; i += 30) {
              const ix = i * 3;
              const x = pos.array[ix] as number;
              const y = pos.array[ix + 1] as number;
              pos.array[ix + 2] = -((x + y) % 1) * 0.25 + Math.sin(t * 1.2 + i * 0.03) * 0.18;
            }
            pos.needsUpdate = true;
          }

          if (lineMesh) {
            lineMesh.material.opacity = 0.10 + (Math.sin(t * 0.9) * 0.05 + 0.07);
          }
        }

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    };

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    const onResize = () => resize();
    resize();
    window.addEventListener('resize', onResize);
    start();

    return () => {
      alive = false;
      stop();
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      if (disposed) return;
      disposed = true;

      try {
        scene.traverse((obj: any) => {
          if (!obj) return;
          const anyObj = obj as any;
          if (anyObj.geometry) anyObj.geometry.dispose?.();
          if (anyObj.material) {
            if (Array.isArray(anyObj.material)) anyObj.material.forEach((m: any) => m.dispose?.());
            else anyObj.material.dispose?.();
          }
        });
        renderer.dispose();
      } catch {
        // ignore
      }
    };
  }, [variant, seed, reducedMotionRef]);

  return (
    <div ref={mountRef} className={className}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* ensure canvas doesn't steal clicks */}
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  );
}

export default function ThreeAnimations({ className }: { className?: string }) {
  return (
    <div className={className ? className : ''}>
      {/* 1) Particles */}
      <ThreeCanvas
        variant="particles"
        className="absolute inset-0 overflow-hidden z-0 opacity-90"
      />
      {/* 2) Ring */}
      <ThreeCanvas
        variant="ring"
        className="absolute inset-0 overflow-hidden z-10 opacity-90"
      />
      {/* 3) Grid */}
      <ThreeCanvas
        variant="grid"
        className="absolute inset-0 overflow-hidden z-20 opacity-80"
      />

      {/* black overlay for readability (tunable via parent) */}
      <div className="absolute inset-0 bg-background/10" />
    </div>
  );
}

