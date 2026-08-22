import * as THREE from "three";
import type { BlochVector } from "../circuit/types";
import { DEFAULT_GRID_OPTIONS } from "../circuit/types";

type VectorArrow = {
  root: THREE.Group;
  shaft: THREE.Mesh;
  head: THREE.Mesh;
};

type SphereRig = {
  root: THREE.Group;
  arrow: VectorArrow;
  mixedStateMarker: THREE.Mesh;
  purityRing: THREE.Mesh;
  qubitLabel: THREE.Sprite;
  decorations: THREE.Object3D[];
};

const TRANSITION_MS = 400;
const MIXED_STATE_MARKER_THRESHOLD = 0.05;
const DIRECTION_EPSILON = 1e-6;
export const SPHERE_SPACING = 2.45;

const ARROW_UP = new THREE.Vector3(0, 1, 0);
const LABEL_OPTIONS = {
  color: "#f6f7fb",
  background: "rgba(11, 16, 32, 0.72)",
  font: "800 52px system-ui, sans-serif",
} as const;

export class BlochSceneContent {
  readonly root = new THREE.Group();
  readonly sphereCount: number;

  private readonly rigs: SphereRig[];
  private readonly currentVectors: THREE.Vector3[];
  private readonly fromVectors: THREE.Vector3[];
  private readonly targetVectors: THREE.Vector3[];
  private readonly interpolationScratch = {
    fromDirection: new THREE.Vector3(),
    toDirection: new THREE.Vector3(),
    auxiliary: new THREE.Vector3(),
  };
  private readonly arrowDirection = new THREE.Vector3();
  private startedAt = performance.now();

  constructor(vectors: BlochVector[], labels: string[], qubitIndices: number[]) {
    this.sphereCount = vectors.length;
    this.currentVectors = vectors.map(createVector3);
    this.fromVectors = vectors.map(createVector3);
    this.targetVectors = vectors.map(createVector3);
    this.rigs = vectors.map((_, index) =>
      createSphereRig(index, vectors.length, labels[index] ?? `q${index}`, qubitIndices[index] ?? index),
    );

    this.rigs.forEach((rig) => this.root.add(rig.root));
    this.root.add(createFloorGrid(vectors.length));
  }

  setTargetVectors(vectors: BlochVector[], snap: boolean, startedAt = performance.now()) {
    this.startedAt = startedAt;
    for (let index = 0; index < this.sphereCount; index += 1) {
      const source = vectors[index];
      const target = this.targetVectors[index];
      if (source) {
        target.set(source.x, source.y, source.z);
      } else {
        target.set(0, 0, 1);
      }

      if (snap) {
        this.currentVectors[index].copy(target);
        this.fromVectors[index].copy(target);
      } else {
        this.fromVectors[index].copy(this.currentVectors[index]);
      }
    }
  }

  setLabels(labels: string[]) {
    this.rigs.forEach((rig, index) => {
      updateTextSprite(rig.qubitLabel, labels[index] ?? `q${index}`, LABEL_OPTIONS);
    });
  }

  setQubitIndices(qubitIndices: number[]) {
    this.rigs.forEach((rig, index) => {
      updateRigVectorColor(rig, colorForQubitIndex(qubitIndices[index] ?? index));
    });
  }

  setDecorativeDetailsVisible(visible: boolean) {
    this.rigs.forEach((rig) => rig.decorations.forEach((decoration) => (decoration.visible = visible)));
  }

  update(time: number) {
    const elapsed = clamp((time - this.startedAt) / TRANSITION_MS, 0, 1);
    const eased = elapsed * elapsed * (3 - 2 * elapsed);

    for (let index = 0; index < this.rigs.length; index += 1) {
      const vector = interpolateBlochVectorInto(
        this.fromVectors[index],
        this.targetVectors[index],
        eased,
        this.currentVectors[index],
        this.interpolationScratch,
      );
      const rig = this.rigs[index];
      const length = vector.length();
      const showMixedStateMarker = length <= MIXED_STATE_MARKER_THRESHOLD;
      rig.arrow.root.visible = !showMixedStateMarker;
      rig.mixedStateMarker.visible = showMixedStateMarker;

      if (!showMixedStateMarker) {
        this.arrowDirection.copy(vector).multiplyScalar(1 / length);
        updateVectorArrow(rig.arrow, this.arrowDirection, length * 0.94);
      }

      rig.purityRing.scale.setScalar(0.74 + 0.24 * Math.sqrt(this.targetVectors[index].lengthSq()));
    }
  }

  dispose() {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
        geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        objectMaterials.forEach((material) => materials.add(material));
      } else if (object instanceof THREE.Sprite) {
        materials.add(object.material);
        if (object.material.map) textures.add(object.material.map);
      }
    });

    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    this.root.clear();
  }
}

type InterpolationScratch = {
  fromDirection: THREE.Vector3;
  toDirection: THREE.Vector3;
  auxiliary: THREE.Vector3;
};

export function interpolateBlochVectorInto(
  from: THREE.Vector3,
  to: THREE.Vector3,
  amount: number,
  result: THREE.Vector3,
  scratch: InterpolationScratch,
): THREE.Vector3 {
  const fromLength = from.length();
  const toLength = to.length();
  const length = fromLength + (toLength - fromLength) * amount;

  if (length <= DIRECTION_EPSILON) return result.set(0, 0, 0);
  if (fromLength <= DIRECTION_EPSILON) return result.copy(to).normalize().multiplyScalar(length);
  if (toLength <= DIRECTION_EPSILON) return result.copy(from).normalize().multiplyScalar(length);

  const fromDirection = scratch.fromDirection.copy(from).multiplyScalar(1 / fromLength);
  const toDirection = scratch.toDirection.copy(to).multiplyScalar(1 / toLength);
  const dot = clamp(fromDirection.dot(toDirection), -1, 1);

  if (dot > 1 - DIRECTION_EPSILON) {
    return result.copy(fromDirection).lerp(toDirection, amount).normalize().multiplyScalar(length);
  }

  if (dot < -1 + DIRECTION_EPSILON) {
    const tangent = scratch.auxiliary.set(Math.abs(fromDirection.x) < 0.8 ? 1 : 0, Math.abs(fromDirection.x) < 0.8 ? 0 : 1, 0);
    tangent.addScaledVector(fromDirection, -tangent.dot(fromDirection)).normalize();
    return result
      .copy(fromDirection)
      .multiplyScalar(Math.cos(Math.PI * amount))
      .addScaledVector(tangent, Math.sin(Math.PI * amount))
      .multiplyScalar(length);
  }

  const angle = Math.acos(dot);
  const relativeDirection = scratch.auxiliary.copy(toDirection).addScaledVector(fromDirection, -dot).normalize();
  return result
    .copy(fromDirection)
    .multiplyScalar(Math.cos(angle * amount))
    .addScaledVector(relativeDirection, Math.sin(angle * amount))
    .multiplyScalar(length);
}

function createSphereRig(index: number, total: number, label: string, qubitIndex: number): SphereRig {
  const root = new THREE.Group();
  root.position.x = (index - (total - 1) / 2) * SPHERE_SPACING;

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
  const depthGuides = createDepthGuides();
  const boundingCube = createBoundingCube();
  root.add(depthGuides);
  root.add(boundingCube);
  root.add(createAxisLabels());

  const vectorColor = colorForQubitIndex(qubitIndex);
  const arrow = createVectorArrow(vectorColor);
  root.add(arrow.root);

  const mixedStateMarker = createMixedStateMarker(vectorColor);
  root.add(mixedStateMarker);

  const purityRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.008, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xf6f7fb, transparent: true, opacity: 0.26 }),
  );
  purityRing.rotation.x = Math.PI / 2;
  root.add(purityRing);

  const qubitLabel = createTextSprite(label, LABEL_OPTIONS);
  qubitLabel.position.set(0, -0.58, 1.68);
  qubitLabel.scale.set(0.58, 0.29, 1);
  root.add(qubitLabel);

  return { root, arrow, mixedStateMarker, purityRing, qubitLabel, decorations: [depthGuides, boundingCube] };
}

function colorForQubitIndex(qubitIndex: number): number {
  return qubitIndex % 2 === 0 ? 0xffdc73 : 0x60d394;
}

function updateRigVectorColor(rig: SphereRig, color: number) {
  setMeshColor(rig.arrow.shaft, color);
  setMeshColor(rig.arrow.head, color);
  setMeshColor(rig.mixedStateMarker, color);
}

function setMeshColor(mesh: THREE.Mesh, color: number) {
  const material = mesh.material;
  if (material instanceof THREE.MeshBasicMaterial) material.color.setHex(color);
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
  updateVectorArrow({ root, shaft, head }, ARROW_UP, 0.94);
  return { root, shaft, head };
}

function createMixedStateMarker(color: number): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 24, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.96, depthWrite: false }),
  );
  marker.visible = false;
  return marker;
}

function updateVectorArrow(arrow: VectorArrow, direction: THREE.Vector3, length: number) {
  const headLength = Math.min(0.28, Math.max(0.18, length * 0.28));
  const shaftLength = Math.max(0.001, length - headLength);
  arrow.root.quaternion.setFromUnitVectors(ARROW_UP, direction);
  arrow.shaft.scale.set(1, shaftLength, 1);
  arrow.shaft.position.set(0, shaftLength / 2, 0);
  arrow.head.position.set(0, shaftLength + headLength / 2, 0);
}

function createDepthGuides(): THREE.Group {
  const group = new THREE.Group();
  const guideMaterial = new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.18, depthWrite: false });

  [-0.66, -0.33, 0.33, 0.66].forEach((z) => {
    const radius = Math.sqrt(1 - z * z);
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(makeCircle(radius, z, "longitude")), guideMaterial));
  });

  const depthLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -1.22), new THREE.Vector3(0, 0, 1.22)]),
    new THREE.LineBasicMaterial({ color: 0xf6f7fb, transparent: true, opacity: 0.12 }),
  );
  group.add(depthLine);
  return group;
}

function createBoundingCube(): THREE.LineSegments {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.36, 2.36, 2.36)),
    new THREE.LineBasicMaterial({ color: 0xe8ecf4, transparent: true, opacity: 0.16, depthWrite: false }),
  );
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
    const sprite = createTextSprite(text, { color });
    sprite.position.copy(position);
    group.add(sprite);
  });
  return group;
}

type TextSpriteOptions = {
  color: string;
  background?: string;
  font?: string;
};

function createTextSprite(text: string, options: TextSpriteOptions): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();

  drawTextSpriteCanvas(context, text, options);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.5, 0.25, 1);
  return sprite;
}

function updateTextSprite(sprite: THREE.Sprite, text: string, options: TextSpriteOptions) {
  const texture = sprite.material.map;
  const image = texture?.image;
  if (!(image instanceof HTMLCanvasElement)) return;
  const context = image.getContext("2d");
  if (!context || !texture) return;
  drawTextSpriteCanvas(context, text, options);
  texture.needsUpdate = true;
}

function drawTextSpriteCanvas(context: CanvasRenderingContext2D, text: string, options: TextSpriteOptions) {
  const canvas = context.canvas;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (options.background) {
    context.fillStyle = options.background;
    context.beginPath();
    drawRoundedRect(context, 38, 28, canvas.width - 76, canvas.height - 56, 24);
    context.fill();
  }
  context.font = options.font ?? "700 48px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 7;
  context.strokeStyle = "rgba(11, 16, 32, 0.88)";
  context.fillStyle = options.color;
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
}

function createFloorGrid(total: number): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0x6f86b8, transparent: true, opacity: 0.12, depthWrite: false });
  const width = Math.max(6, total * 2.8);
  const depth = 6;
  const divisions = Math.max(12, total * 4);
  const y = -1.32;

  for (let index = 0; index <= divisions; index += 1) {
    const x = -width / 2 + (width * index) / divisions;
    const z = -depth / 2 + (depth * index) / divisions;
    group.add(createLine([new THREE.Vector3(-width / 2, y, z), new THREE.Vector3(width / 2, y, z)], material));
    group.add(createLine([new THREE.Vector3(x, y, -depth / 2), new THREE.Vector3(x, y, depth / 2)], material));
  }
  return group;
}

function createGrid(): THREE.Group {
  const group = new THREE.Group();
  for (let lat = 1; lat <= DEFAULT_GRID_OPTIONS.latitudeCount; lat += 1) {
    const phi = (lat / (DEFAULT_GRID_OPTIONS.latitudeCount + 1)) * Math.PI;
    group.add(createLineLoop(makeCircle(Math.sin(phi), Math.cos(phi), "latitude")));
  }
  for (let lon = 0; lon < DEFAULT_GRID_OPTIONS.longitudeCount; lon += 1) {
    const line = createLineLoop(makeCircle(1, 0, "longitude"));
    line.rotation.y = (lon / DEFAULT_GRID_OPTIONS.longitudeCount) * Math.PI;
    group.add(line);
  }
  return group;
}

function createAxes(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  group.add(createLine([new THREE.Vector3(-1.12, 0, 0), new THREE.Vector3(1.12, 0, 0)], material));
  group.add(createLine([new THREE.Vector3(0, -1.12, 0), new THREE.Vector3(0, 1.12, 0)], material));
  group.add(createLine([new THREE.Vector3(0, 0, -1.12), new THREE.Vector3(0, 0, 1.12)], material));
  return group;
}

function makeCircle(radius: number, y: number, kind: "latitude" | "longitude"): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let step = 0; step <= 96; step += 1) {
    const theta = (step / 96) * Math.PI * 2;
    points.push(
      kind === "latitude"
        ? new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
        : new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, y),
    );
  }
  return points;
}

function createLine(points: THREE.Vector3[], material: THREE.Material): THREE.Line {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function createLineLoop(points: THREE.Vector3[]): THREE.Line {
  return createLine(
    points,
    new THREE.LineBasicMaterial({ color: 0xd8e0ff, transparent: true, opacity: DEFAULT_GRID_OPTIONS.opacity }),
  );
}

function createVector3(vector: BlochVector): THREE.Vector3 {
  return new THREE.Vector3(vector.x, vector.y, vector.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
