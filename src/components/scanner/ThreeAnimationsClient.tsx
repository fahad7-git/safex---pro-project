"use client";

import { useEffect, useMemo, useRef, memo } from 'react';
import * as THREE_NS from 'three';

type Variant = 'particles' | 'ring' | 'grid';
const THREE: any = THREE_NS as any;

function usePrefersReducedMotion() {
  const value = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => {
      value.current = mq.matches;
    };
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return value;
}

function ThreeCanvas({ variant, className }: { variant: Variant; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reducedMotionRef = usePrefersReducedMotion();

  const seed = useMemo(() => {
    return variant === 'particles' ? 1337 : variant === 'ring' ? 4242 : 9001;
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = mountRef.current;
    if (!canvas || !mount) return;

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


    // WebGL can fail on some devices/browsers. Fail gracefully.
    let renderer: any = null;
    try {
      const gl = canvas.getContext?.('webgl2') || canvas.getContext?.('webgl') || canvas.getContext?.('experimental-webgl');
      if (!gl) return;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    } catch {
      return;
    }


    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, variant === 'grid' ? 6 : 7);

    const lightA = new THREE.PointLight(0x59c3ff, 1.2, 40);
    lightA.position.set(3, 3, 6);
    scene.add(lightA);

    const lightB = new THREE.PointLight(0x10b981, 0.9, 40);
    lightB.position.set(-3, -2, 6);
    scene.add(lightB);

    const group = new THREE.Group();
    scene.add(group);

    // Deterministic RNG
    const random = (() => {
      let t = seed;
      return () => {
        t = (t * 1664525 + 1013904223) % 4294967296;
        return t / 4294967296;
      };
    })();

    let mesh: any = null;

    if (variant === 'particles') {
      const count = 1800;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.pow(random(), 0.4) * 5.2;
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.cos(phi);
        positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        const c = random();
        const rC = c < 0.5 ? 0.16 : 0.23;
        const gC = c < 0.5 ? 0.74 : 0.32;
        const bC = c < 0.5 ? 1.0 : 0.86;

        colors[i3] = rC;
        colors[i3 + 1] = gC;
        colors[i3 + 2] = bC;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
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
      const geom = new THREE.TorusGeometry(2.2, 0.28, 18, 120);
      const mat = new THREE.MeshStandardMaterial({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (group.userData as any).__glow = glow;
    } else {
      const width = 18;
      const height = 10;
      const pts: number[] = [];
      const cols: number[] = [];
      const lines: number[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const xf = (x - width / 2) * 0.28;
          const yf = (y - height / 2) * 0.22;
          const zf = -((x + y) % 7) * 0.02;
          pts.push(xf, yf, zf);

          const n = x / width;
          cols.push(0.2 + 0.2 * n, 0.8, 1.0);

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

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
      geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));

      const mat = new THREE.PointsMaterial({
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
      group.userData.__lineMesh = lineMesh;
    }

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const start = () => {
      if (!alive || disposed) return;
      if (reducedMotionRef.current) return;
      if (raf) return;

      const t0 = performance.now();
      const tick = () => {
        if (!alive || disposed) return;
        const t = (performance.now() - t0) / 1000;

        if (variant === 'particles') {
          group.rotation.y = t * 0.08;
          group.rotation.x = Math.sin(t * 0.2) * 0.05;
          group.scale.setScalar(1 + Math.sin(t * 0.3) * 0.02);
        } else if (variant === 'ring') {
          const glow = group.userData.__glow as any;
          group.rotation.y = t * 0.45;
          group.rotation.x = 0.55 + Math.sin(t * 0.8) * 0.12;
          if (glow) glow.rotation.y = -t * 0.8;
          camera.position.z = 7 + Math.sin(t * 0.5) * 0.35;
        } else {
          const lineMesh = group.userData.__lineMesh as any;
          group.rotation.z = Math.sin(t * 0.22) * 0.1;

          const points = mesh as any;
          const pos = points.geometry.getAttribute('position');
          for (let i = 0; i < pos.count; i += 30) {
            const ix = i * 3;
            const x = pos.array[ix];
            const y = pos.array[ix + 1];
            pos.array[ix + 2] = -((x + y) % 1) * 0.25 + Math.sin(t * 1.2 + i * 0.03) * 0.18;
          }
          pos.needsUpdate = true;

          if (lineMesh) lineMesh.material.opacity = 0.10 + (Math.sin(t * 0.9) * 0.05 + 0.07);
        }

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    };

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
          if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m?.dispose?.());
            else obj.material.dispose?.();
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
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  );
}

const ThreeAnimationsClient = memo(function ThreeAnimationsClient({ className }: { className?: string }) {
  // Performance: render a single WebGL canvas/renderer to avoid WebGL context exhaustion.
  // If you want multiple effects layered, create them inside the same Three.js scene/renderer instead.
  return (
    <div className={className ?? ''}>
      <ThreeCanvas variant="particles" className="absolute inset-0 overflow-hidden z-0 opacity-90" />
      <div className="absolute inset-0 bg-background/10" />
    </div>
  );
});

export default ThreeAnimationsClient;


