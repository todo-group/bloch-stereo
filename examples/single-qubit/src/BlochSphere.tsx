import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AdjustableAnaglyphEffect } from "./AdjustableAnaglyphEffect";
import type { BlochVec } from "./qubit";

type Props = {
  vector: BlochVec;
  activeStep: number;
  stereoEnabled: boolean;
  eyeSeparation: number;
  stereoFocus: number;
  redGain: number;
  cyanGain: number;
};

type AnimState = {
  startedAt: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
};

type VectorArrow = {
  root: THREE.Group;
  shaft: THREE.Mesh;
  head: THREE.Mesh;
};

const TRANSITION_MS = 400;
const STANDARD_CAMERA_RADIUS = 5.5;
const STEREO_CAMERA_RADIUS = 4.6;

// Bloch (x, y, z) → Three.js (x, z, -y)
// so |0⟩ (Bloch z=+1) → Three.js +Y = top of screen
function toVec3(v: BlochVec): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.z, -v.y);
}

export function BlochSphere({
  vector,
  activeStep,
  stereoEnabled,
  eyeSeparation,
  stereoFocus,
  redGain,
  cyanGain,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stereoEnabledRef = useRef(stereoEnabled);
  const eyeSeparationRef = useRef(eyeSeparation);
  const stereoFocusRef = useRef(stereoFocus);
  const redGainRef = useRef(redGain);
  const cyanGainRef = useRef(cyanGain);
  const currentRef = useRef(toVec3(vector));
  const animRef = useRef<AnimState>({
    startedAt: performance.now(),
    from: toVec3(vector),
    to: toVec3(vector),
  });

  const targetVec = useMemo(() => toVec3(vector), [vector.x, vector.y, vector.z]);

  useEffect(() => {
    animRef.current = {
      startedAt: performance.now(),
      from: currentRef.current.clone(),
      to: targetVec.clone(),
    };
  }, [targetVec, activeStep]);

  useEffect(() => {
    stereoEnabledRef.current = stereoEnabled;
  }, [stereoEnabled]);

  useEffect(() => {
    eyeSeparationRef.current = eyeSeparation;
  }, [eyeSeparation]);

  useEffect(() => {
    stereoFocusRef.current = stereoFocus;
  }, [stereoFocus]);

  useEffect(() => {
    redGainRef.current = redGain;
  }, [redGain]);

  useEffect(() => {
    cyanGainRef.current = cyanGain;
  }, [cyanGain]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const mount = mountRef.current;
    const motion = {
      yaw: -0.55,
      pitch: 0.32,
      radius: STANDARD_CAMERA_RADIUS,
      targetRadius: STANDARD_CAMERA_RADIUS,
      yawV: 0,
      pitchV: 0,
    };
    const ptr = { dragging: false, x: 0, y: 0 };

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0b1020, 1);
    mount.appendChild(renderer.domElement);
    const effect = new AdjustableAnaglyphEffect(renderer);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 4);
    scene.add(key);

    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0x7aa2ff,
          transparent: true,
          opacity: 0.13,
          roughness: 0.28,
          transmission: 0.24,
          depthWrite: false,
        }),
      ),
    );
    scene.add(createGrid());
    scene.add(createAxes());
    scene.add(createDepthGuides());
    scene.add(createFloorGrid());
    scene.add(createBoundingCube());
    scene.add(createAxisLabels());

    const arrow = createVectorArrow();
    scene.add(arrow.root);

    const resize = () => {
      const b = mount.getBoundingClientRect();
      const w = Math.max(1, Math.floor(b.width));
      const h = Math.max(1, Math.floor(b.height));
      renderer.setSize(w, h, false);
      effect.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onPointerDown = (e: PointerEvent) => {
      ptr.dragging = true;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!ptr.dragging) return;
      motion.yawV += (e.clientX - ptr.x) * 0.0009;
      motion.pitchV += (e.clientY - ptr.y) * 0.00075;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
    };
    const onPointerUp = () => {
      ptr.dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      motion.targetRadius = Math.max(3.5, Math.min(10, motion.targetRadius + e.deltaY * 0.004));
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);

      const anim = animRef.current;
      const t = Math.max(0, Math.min(1, (time - anim.startedAt) / TRANSITION_MS));
      const eased = t * t * (3 - 2 * t);
      const cur = anim.from.clone().lerp(anim.to, eased);
      currentRef.current = cur;
      const len = Math.max(0.001, cur.length());
      updateVectorArrow(arrow, cur.clone().divideScalar(len), len * 0.94);

      if (stereoEnabledRef.current && motion.targetRadius > STEREO_CAMERA_RADIUS) {
        motion.targetRadius += (STEREO_CAMERA_RADIUS - motion.targetRadius) * 0.035;
      }
      motion.radius += (motion.targetRadius - motion.radius) * 0.08;
      motion.yaw += motion.yawV;
      motion.pitch = Math.max(-0.9, Math.min(0.9, motion.pitch + motion.pitchV));
      motion.yawV *= ptr.dragging ? 0.82 : 0.94;
      motion.pitchV *= ptr.dragging ? 0.82 : 0.94;
      camera.position.set(
        Math.sin(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
        Math.sin(motion.pitch) * motion.radius,
        Math.cos(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
      );
      camera.focus = stereoEnabledRef.current ? stereoFocusRef.current : motion.radius;
      camera.lookAt(0, 0, 0);
      if (stereoEnabledRef.current) {
        effect.eyeSeparation = eyeSeparationRef.current;
        effect.redGain = redGainRef.current;
        effect.cyanGain = cyanGainRef.current;
        effect.render(scene, camera);
      } else {
        renderer.render(scene, camera);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        } else if (obj instanceof THREE.Sprite) {
          const material = obj.material;
          material.map?.dispose();
          material.dispose();
        }
      });
      effect.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`bloch-wrapper${stereoEnabled ? " is-stereo" : ""}`}>
      <div ref={mountRef} className="bloch-canvas" />
      <div className="bloch-legend" aria-hidden="true">
        ↑ |0⟩ &nbsp; ↓ |1⟩
        <br />
        drag: rotate &nbsp; scroll: zoom
      </div>
    </div>
  );
}

function createDepthGuides(): THREE.Group {
  const group = new THREE.Group();

  const guideMaterial = new THREE.LineBasicMaterial({
    color: 0x9fb4ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const forwardMaterial = new THREE.MeshBasicMaterial({
    color: 0xf6f7fb,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const rearMaterial = new THREE.MeshBasicMaterial({
    color: 0x51627d,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });

  [-0.66, -0.33, 0.33, 0.66].forEach((z) => {
    const radius = Math.sqrt(1 - z * z);
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(makeDepthCircle(radius, z)),
      guideMaterial,
    );
    group.add(ring);
  });

  const frontMarker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 8), forwardMaterial);
  frontMarker.position.set(0, 0, 1.16);
  group.add(frontMarker);

  const rearMarker = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 8), rearMaterial);
  rearMarker.position.set(0, 0, -1.16);
  group.add(rearMarker);

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

function makeDepthCircle(radius: number, z: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let step = 0; step <= 96; step++) {
    const theta = (step / 96) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, z));
  }
  return points;
}

function createVectorArrow(): VectorArrow {
  const root = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xffdc73,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    wireframe: true,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1, 18, 3), material);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 24, 3), material);
  root.add(shaft, head);
  updateVectorArrow({ root, shaft, head }, new THREE.Vector3(0, 1, 0), 0.94);
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

function createAxisLabels(): THREE.Group {
  const group = new THREE.Group();
  const offset = 1.48;
  const labels: Array<{ text: string; position: THREE.Vector3; color: string }> = [
    { text: "|0⟩", position: new THREE.Vector3(0, offset, 0), color: "#f6f7fb" },
    { text: "|1⟩", position: new THREE.Vector3(0, -offset, 0), color: "#f6f7fb" },
    { text: "|+⟩", position: new THREE.Vector3(offset, 0, 0), color: "#ffd166" },
    { text: "|-⟩", position: new THREE.Vector3(-offset, 0, 0), color: "#ffd166" },
    { text: "|i⟩", position: new THREE.Vector3(0, 0, -offset), color: "#60d394" },
    { text: "|-i⟩", position: new THREE.Vector3(0, 0, offset), color: "#60d394" },
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

function createFloorGrid(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x6f86b8,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const size = 6;
  const divisions = 12;
  const y = -1.32;

  for (let i = 0; i <= divisions; i++) {
    const p = -size / 2 + (size * i) / divisions;
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-size / 2, y, p),
          new THREE.Vector3(size / 2, y, p),
        ]),
        material,
      ),
    );
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p, y, -size / 2),
          new THREE.Vector3(p, y, size / 2),
        ]),
        material,
      ),
    );
  }

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

function createGrid(): THREE.Group {
  const group = new THREE.Group();
  const LAT = 4;
  const LON = 8;
  const OPACITY = 0.18;

  for (let i = 1; i <= LAT; i++) {
    const phi = (i / (LAT + 1)) * Math.PI;
    const y = Math.cos(phi);
    const r = Math.sin(phi);
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 96; s++) {
      const theta = (s / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }
    group.add(makeLine(pts, OPACITY));
  }

  for (let i = 0; i < LON; i++) {
    const angle = (i / LON) * Math.PI;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 96; s++) {
      const theta = (s / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
    }
    const line = makeLine(pts, OPACITY);
    line.rotation.y = angle;
    group.add(line);
  }

  return group;
}

function createAxes(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  const pairs: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-1.18, 0, 0), new THREE.Vector3(1.18, 0, 0)],
    [new THREE.Vector3(0, -1.18, 0), new THREE.Vector3(0, 1.18, 0)],
    [new THREE.Vector3(0, 0, -1.18), new THREE.Vector3(0, 0, 1.18)],
  ];
  for (const [start, end] of pairs) {
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), mat));
  }
  return group;
}

function makeLine(pts: THREE.Vector3[], opacity: number): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xd8e0ff, transparent: true, opacity }),
  );
}
