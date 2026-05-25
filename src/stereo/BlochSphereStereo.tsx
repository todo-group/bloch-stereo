import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AnaglyphEffect } from "three/examples/jsm/effects/AnaglyphEffect.js";
import type { BlochVector, DisplayMode } from "../circuit/types";
import { DEFAULT_GRID_OPTIONS } from "../circuit/types";

type BlochSphereStereoProps = {
  vectors: BlochVector[];
  displayMode: DisplayMode;
  activeStep: number;
};

type SphereRig = {
  root: THREE.Group;
  arrow: THREE.ArrowHelper;
  purityRing: THREE.Mesh;
};

type AnimationState = {
  startedAt: number;
  from: THREE.Vector3[];
  to: THREE.Vector3[];
};

const TRANSITION_MS = 400;

export function BlochSphereStereo({ vectors, displayMode, activeStep }: BlochSphereStereoProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const effectRef = useRef<AnaglyphEffect | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rigsRef = useRef<SphereRig[]>([]);
  const currentRef = useRef<THREE.Vector3[]>(vectors.map(toVector3));
  const animationRef = useRef<AnimationState>({
    startedAt: performance.now(),
    from: vectors.map(toVector3),
    to: vectors.map(toVector3),
  });
  const modeRef = useRef(displayMode);
  const cameraMotion = useRef({ yaw: -0.55, pitch: 0.32, radius: 6.2, yawVelocity: 0, pitchVelocity: 0 });
  const pointerRef = useRef({ dragging: false, x: 0, y: 0 });

  const targetVectors = useMemo(() => vectors.map(toVector3), [vectors]);

  useEffect(() => {
    modeRef.current = displayMode;
  }, [displayMode]);

  useEffect(() => {
    animationRef.current = {
      startedAt: performance.now(),
      from: currentRef.current.map((vector) => vector.clone()),
      to: targetVectors.map((vector) => vector.clone()),
    };
  }, [targetVectors, activeStep]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0b1020, 1);
    mount.appendChild(renderer.domElement);

    const effect = new AnaglyphEffect(renderer);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 4);
    scene.add(ambient, keyLight);

    const rigs = vectors.map((_, index) => createSphereRig(index, vectors.length));
    rigs.forEach((rig) => scene.add(rig.root));

    rendererRef.current = renderer;
    effectRef.current = effect;
    sceneRef.current = scene;
    cameraRef.current = camera;
    rigsRef.current = rigs;

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));
      renderer.setSize(width, height, false);
      effect.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerRef.current = { dragging: true, x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      cameraMotion.current.yawVelocity += dx * 0.0009;
      cameraMotion.current.pitchVelocity += dy * 0.00075;
    };
    const onPointerUp = () => {
      pointerRef.current.dragging = false;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraMotion.current.radius = clamp(cameraMotion.current.radius + event.deltaY * 0.004, 3.8, 10);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    const render = (time: number) => {
      frame = window.requestAnimationFrame(render);
      updateVectors(time);
      updateCamera(camera);
      if (modeRef.current === "anaglyph-red-green") {
        effect.render(scene, camera);
      } else {
        renderer.render(scene, camera);
      }
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      mount.removeChild(renderer.domElement);
      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: THREE.Material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [vectors.length]);

  return (
    <div className={displayMode === "anaglyph-red-green" ? "bloch-stage is-stereo" : "bloch-stage"}>
      <div ref={mountRef} className="bloch-canvas" />
      <div className="sphere-labels" aria-hidden="true">
        {vectors.map((vector, index) => (
          <span key={index}>
            q{index} · purity {vector.purity.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );

  function updateVectors(time: number) {
    const animation = animationRef.current;
    const elapsed = clamp((time - animation.startedAt) / TRANSITION_MS, 0, 1);
    const eased = elapsed * elapsed * (3 - 2 * elapsed);
    const current = animation.to.map((target, index) => {
      const from = animation.from[index] ?? new THREE.Vector3(0, 0, 1);
      return from.clone().lerp(target, eased);
    });
    currentRef.current = current;
    rigsRef.current.forEach((rig, index) => {
      const vector = current[index] ?? new THREE.Vector3(0, 0, 1);
      const length = Math.max(0.001, vector.length());
      const direction = length > 0.001 ? vector.clone().normalize() : new THREE.Vector3(0, 0, 1);
      rig.arrow.setDirection(direction);
      rig.arrow.setLength(length * 0.92, 0.14, 0.08);
      const target = targetVectors[index];
      rig.purityRing.scale.setScalar(0.74 + 0.24 * Math.sqrt(target?.lengthSq() ?? 1));
    });
  }

  function updateCamera(camera: THREE.PerspectiveCamera) {
    const motion = cameraMotion.current;
    motion.yaw += motion.yawVelocity;
    motion.pitch = clamp(motion.pitch + motion.pitchVelocity, -0.9, 0.9);
    motion.yawVelocity *= pointerRef.current.dragging ? 0.82 : 0.94;
    motion.pitchVelocity *= pointerRef.current.dragging ? 0.82 : 0.94;
    camera.position.set(
      Math.sin(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
      Math.sin(motion.pitch) * motion.radius,
      Math.cos(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
    );
    camera.lookAt(0, 0, 0);
  }
}

function createSphereRig(index: number, total: number): SphereRig {
  const root = new THREE.Group();
  const spacing = 2.45;
  root.position.x = (index - (total - 1) / 2) * spacing;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x7aa2ff,
      transparent: true,
      opacity: 0.13,
      roughness: 0.28,
      transmission: 0.24,
      depthWrite: false,
    }),
  );
  root.add(sphere);
  root.add(createGrid());
  root.add(createAxes());

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    0.92,
    index % 2 === 0 ? 0xffd166 : 0x60d394,
    0.14,
    0.08,
  );
  root.add(arrow);

  const purityRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.008, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xf6f7fb, transparent: true, opacity: 0.26 }),
  );
  purityRing.rotation.x = Math.PI / 2;
  root.add(purityRing);

  return { root, arrow, purityRing };
}

function createGrid(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0xd8e0ff,
    transparent: true,
    opacity: DEFAULT_GRID_OPTIONS.opacity,
  });

  for (let lat = 1; lat <= DEFAULT_GRID_OPTIONS.latitudeCount; lat += 1) {
    const phi = (lat / (DEFAULT_GRID_OPTIONS.latitudeCount + 1)) * Math.PI;
    const y = Math.cos(phi);
    const radius = Math.sin(phi);
    group.add(createLineLoop(makeCircle(radius, y, "latitude"), material));
  }

  for (let lon = 0; lon < DEFAULT_GRID_OPTIONS.longitudeCount; lon += 1) {
    const angle = (lon / DEFAULT_GRID_OPTIONS.longitudeCount) * Math.PI;
    const line = createLineLoop(makeCircle(1, 0, "longitude"), material);
    line.rotation.y = angle;
    group.add(line);
  }

  return group;
}

function createAxes(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  [
    [new THREE.Vector3(-1.12, 0, 0), new THREE.Vector3(1.12, 0, 0)],
    [new THREE.Vector3(0, -1.12, 0), new THREE.Vector3(0, 1.12, 0)],
    [new THREE.Vector3(0, 0, -1.12), new THREE.Vector3(0, 0, 1.12)],
  ].forEach(([start, end]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    group.add(new THREE.Line(geometry, material));
  });
  return group;
}

function makeCircle(radius: number, y: number, kind: "latitude" | "longitude"): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let step = 0; step <= 96; step += 1) {
    const theta = (step / 96) * Math.PI * 2;
    if (kind === "latitude") {
      points.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
    } else {
      points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, y));
    }
  }
  return points;
}

function createLineLoop(points: THREE.Vector3[], material: THREE.LineBasicMaterial): THREE.Line {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
}

function toVector3(vector: BlochVector): THREE.Vector3 {
  return new THREE.Vector3(vector.x, vector.y, vector.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
