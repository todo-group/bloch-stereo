import { useEffect, useMemo, useRef } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { AdjustableAnaglyphEffect } from "./AdjustableAnaglyphEffect";
import type { BlochVector, DisplayMode, StereoSettings } from "../circuit/types";
import { DEFAULT_GRID_OPTIONS } from "../circuit/types";

type BlochSphereStereoProps = {
  vectors: BlochVector[];
  labels: string[];
  displayMode: DisplayMode;
  stereoSettings: StereoSettings;
  activeStep: number;
};

type VectorArrow = {
  root: THREE.Group;
  shaft: THREE.Mesh;
  head: THREE.Mesh;
};

type SphereRig = {
  root: THREE.Group;
  arrow: VectorArrow;
  purityRing: THREE.Mesh;
};

type AnimationState = {
  startedAt: number;
  from: THREE.Vector3[];
  to: THREE.Vector3[];
};

const TRANSITION_MS = 400;
const STANDARD_CAMERA_RADIUS = 6.2;
const RESET_CAMERA_YAW = 0;
const RESET_CAMERA_PITCH = 0;

export function BlochSphereStereo({ vectors, labels, displayMode, stereoSettings, activeStep }: BlochSphereStereoProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const effectRef = useRef<AdjustableAnaglyphEffect | null>(null);
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
  const stereoSettingsRef = useRef(stereoSettings);
  const cameraMotion = useRef({
    yaw: RESET_CAMERA_YAW,
    pitch: RESET_CAMERA_PITCH,
    radius: STANDARD_CAMERA_RADIUS,
    targetRadius: STANDARD_CAMERA_RADIUS,
    yawVelocity: 0,
    pitchVelocity: 0,
  });
  const pointerRef = useRef({ dragging: false, x: 0, y: 0 });

  const targetVectors = useMemo(() => vectors.map(toVector3), [vectors]);

  useEffect(() => {
    modeRef.current = displayMode;
  }, [displayMode]);

  useEffect(() => {
    stereoSettingsRef.current = stereoSettings;
  }, [stereoSettings]);

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

    const effect = new AdjustableAnaglyphEffect(renderer);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 4);
    scene.add(ambient, keyLight);

    const rigs = vectors.map((_, index) => createSphereRig(index, vectors.length));
    rigs.forEach((rig) => scene.add(rig.root));
    scene.add(createFloorGrid(vectors.length));

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
      cameraMotion.current.targetRadius = clamp(cameraMotion.current.targetRadius + event.deltaY * 0.004, 3.8, 12);
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
        effect.eyeSeparation = stereoSettingsRef.current.eyeSeparation;
        effect.redGain = stereoSettingsRef.current.redGain;
        effect.cyanGain = stereoSettingsRef.current.cyanGain;
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
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: THREE.Material) => material.dispose());
        } else if (object instanceof THREE.Sprite) {
          const material = object.material;
          material.map?.dispose();
          material.dispose();
        }
      });
      effect.dispose();
      renderer.dispose();
    };
  }, [vectors.length]);

  return (
    <div className={displayMode === "anaglyph-red-green" ? "bloch-stage is-stereo" : "bloch-stage"}>
      <div ref={mountRef} className="bloch-canvas" />
      <button type="button" className="camera-reset" onClick={resetCameraView} title="Reset Bloch sphere view">
        <RotateCcw aria-hidden="true" />
        View
      </button>
      <div className="sphere-labels" aria-hidden="true">
        {vectors.map((vector, index) => (
          <span key={index}>
            {labels[index] ?? `q${index}`} · purity {vector.purity.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );

  function resetCameraView() {
    cameraMotion.current = {
      yaw: RESET_CAMERA_YAW,
      pitch: RESET_CAMERA_PITCH,
      radius: cameraMotion.current.radius,
      targetRadius: STANDARD_CAMERA_RADIUS,
      yawVelocity: 0,
      pitchVelocity: 0,
    };
    pointerRef.current.dragging = false;
  }

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
      updateVectorArrow(rig.arrow, direction, length * 0.94);
      const target = targetVectors[index];
      rig.purityRing.scale.setScalar(0.74 + 0.24 * Math.sqrt(target?.lengthSq() ?? 1));
    });
  }

  function updateCamera(camera: THREE.PerspectiveCamera) {
    const motion = cameraMotion.current;
    if (modeRef.current === "anaglyph-red-green") {
      const stereoRadius = clamp(4.6 + vectors.length * 0.35, 4.8, 8.2);
      if (motion.targetRadius > stereoRadius) {
        motion.targetRadius += (stereoRadius - motion.targetRadius) * 0.035;
      }
    }
    motion.radius += (motion.targetRadius - motion.radius) * 0.08;
    motion.yaw += motion.yawVelocity;
    motion.pitch = clamp(motion.pitch + motion.pitchVelocity, -0.9, 0.9);
    motion.yawVelocity *= pointerRef.current.dragging ? 0.82 : 0.94;
    motion.pitchVelocity *= pointerRef.current.dragging ? 0.82 : 0.94;
    camera.up.set(0, 0, 1);
    camera.position.set(
      Math.sin(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
      -Math.cos(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
      Math.sin(motion.pitch) * motion.radius,
    );
    camera.focus = modeRef.current === "anaglyph-red-green" ? stereoSettingsRef.current.convergenceDistance : motion.radius;
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
  root.add(createDepthGuides());
  root.add(createBoundingCube());
  root.add(createAxisLabels());

  const arrow = createVectorArrow(index % 2 === 0 ? 0xffdc73 : 0x60d394);
  root.add(arrow.root);

  const purityRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.008, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xf6f7fb, transparent: true, opacity: 0.26 }),
  );
  purityRing.rotation.x = Math.PI / 2;
  root.add(purityRing);

  return { root, arrow, purityRing };
}

function createVectorArrow(color: number): VectorArrow {
  const root = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    wireframe: true,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1, 18, 3), material);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 24, 3), material);
  root.add(shaft, head);
  updateVectorArrow({ root, shaft, head }, new THREE.Vector3(0, 0, 1), 0.94);
  return { root, shaft, head };
}

function updateVectorArrow(arrow: VectorArrow, direction: THREE.Vector3, length: number) {
  const headLength = Math.min(0.28, Math.max(0.18, length * 0.28));
  const shaftLength = Math.max(0.001, length - headLength);
  arrow.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  arrow.shaft.scale.set(1, shaftLength, 1);
  arrow.shaft.position.set(0, shaftLength / 2, 0);
  arrow.head.position.set(0, shaftLength + headLength / 2, 0);
}

function createDepthGuides(): THREE.Group {
  const group = new THREE.Group();
  const guideMaterial = new THREE.LineBasicMaterial({
    color: 0x9fb4ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });

  [-0.66, -0.33, 0.33, 0.66].forEach((z) => {
    const radius = Math.sqrt(1 - z * z);
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(makeCircle(radius, z, "longitude")), guideMaterial));
  });

  const depthLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.22),
      new THREE.Vector3(0, 0, 1.22),
    ]),
    new THREE.LineBasicMaterial({ color: 0xf6f7fb, transparent: true, opacity: 0.12 }),
  );
  group.add(depthLine);
  return group;
}

function createBoundingCube(): THREE.LineSegments {
  const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.36, 2.36, 2.36));
  const material = new THREE.LineBasicMaterial({
    color: 0xe8ecf4,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  return new THREE.LineSegments(geometry, material);
}

function createAxisLabels(): THREE.Group {
  const group = new THREE.Group();
  const offset = 1.48;
  const labels: Array<{ text: string; position: THREE.Vector3; color: string }> = [
    { text: "|0⟩", position: new THREE.Vector3(0, 0, offset), color: "#f6f7fb" },
    { text: "|1⟩", position: new THREE.Vector3(0, 0, -offset), color: "#f6f7fb" },
    { text: "|+⟩", position: new THREE.Vector3(offset, 0, 0), color: "#ffd166" },
    { text: "|-⟩", position: new THREE.Vector3(-offset, 0, 0), color: "#ffd166" },
    { text: "|i⟩", position: new THREE.Vector3(0, offset, 0), color: "#60d394" },
    { text: "|-i⟩", position: new THREE.Vector3(0, -offset, 0), color: "#60d394" },
  ];

  labels.forEach(({ text, position, color }) => {
    const sprite = createTextSprite(text, color);
    sprite.position.copy(position);
    group.add(sprite);
  });

  return group;
}

function createTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "700 48px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 7;
  context.strokeStyle = "rgba(11, 16, 32, 0.88)";
  context.fillStyle = color;
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.5, 0.25, 1);
  return sprite;
}

function createFloorGrid(total: number): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x6f86b8,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const width = Math.max(6, total * 2.8);
  const depth = 6;
  const divisions = Math.max(12, total * 4);
  const y = -1.32;

  for (let i = 0; i <= divisions; i += 1) {
    const x = -width / 2 + (width * i) / divisions;
    const z = -depth / 2 + (depth * i) / divisions;
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-width / 2, y, z),
          new THREE.Vector3(width / 2, y, z),
        ]),
        material,
      ),
    );
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, y, -depth / 2),
          new THREE.Vector3(x, y, depth / 2),
        ]),
        material,
      ),
    );
  }

  return group;
}

function createGrid(): THREE.Group {
  const group = new THREE.Group();

  for (let lat = 1; lat <= DEFAULT_GRID_OPTIONS.latitudeCount; lat += 1) {
    const phi = (lat / (DEFAULT_GRID_OPTIONS.latitudeCount + 1)) * Math.PI;
    const y = Math.cos(phi);
    const radius = Math.sin(phi);
    group.add(createLineLoop(makeCircle(radius, y, "latitude")));
  }

  for (let lon = 0; lon < DEFAULT_GRID_OPTIONS.longitudeCount; lon += 1) {
    const angle = (lon / DEFAULT_GRID_OPTIONS.longitudeCount) * Math.PI;
    const line = createLineLoop(makeCircle(1, 0, "longitude"));
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

function createLineLoop(points: THREE.Vector3[]): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: 0xd8e0ff,
      transparent: true,
      opacity: DEFAULT_GRID_OPTIONS.opacity,
    }),
  );
}

function toVector3(vector: BlochVector): THREE.Vector3 {
  return new THREE.Vector3(vector.x, vector.y, vector.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
