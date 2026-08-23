import * as THREE from "three";
import type { XrPanelAction } from "./XrControlPanel";

const AXIS_LABELS = ["X", "Y", "Z"];
const PAIRS: Array<{ pair: [number, number]; action: XrPanelAction; label: string }> = [
  { pair: [0, 1], action: "select-pair-01", label: "q0/q1" },
  { pair: [0, 2], action: "select-pair-02", label: "q0/q2" },
  { pair: [1, 2], action: "select-pair-12", label: "q1/q2" },
];

export type XrCorrelationState = {
  matrix?: number[][];
  pair: [number, number];
  qubitCount: number;
};

type SelectorButton = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  action: XrPanelAction;
  pair: [number, number];
  label: string;
};

export class XrCorrelationPanel {
  readonly root = new THREE.Group();
  readonly targets: THREE.Object3D[] = [];

  private readonly matrixCanvas = document.createElement("canvas");
  private readonly matrixTexture: THREE.CanvasTexture;
  private readonly matrixMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  private readonly selectors: SelectorButton[];
  private sessionVisible = false;
  private available = false;

  constructor(initialState: XrCorrelationState) {
    this.root.name = "xr-correlation-panel";
    this.matrixCanvas.width = 768;
    this.matrixCanvas.height = 640;
    this.matrixTexture = new THREE.CanvasTexture(this.matrixCanvas);
    this.matrixTexture.colorSpace = THREE.SRGBColorSpace;
    this.matrixMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.4, 0.022),
      new THREE.MeshBasicMaterial({ color: 0xffffff, map: this.matrixTexture, transparent: true }),
    );
    this.matrixMesh.position.y = -0.035;
    this.root.add(this.matrixMesh);

    this.selectors = PAIRS.map(({ pair, action, label }) => {
      const surface = createSelectorSurface();
      surface.mesh.userData.xrAction = action;
      const selector = { ...surface, action, pair, label };
      this.targets.push(surface.mesh);
      this.root.add(surface.mesh);
      return selector;
    });
    this.update(initialState);
  }

  update(state: XrCorrelationState) {
    this.available = Boolean(state.matrix);
    this.root.visible = this.sessionVisible && this.available;
    this.updateSelectors(state.qubitCount, state.pair);
    if (state.matrix) drawMatrix(this.matrixCanvas, this.matrixTexture, state.matrix, state.pair);
  }

  setSessionVisible(visible: boolean) {
    this.sessionVisible = visible;
    this.root.visible = visible && this.available;
  }

  actionFor(object: THREE.Object3D): XrPanelAction | undefined {
    if (!this.root.visible || !object.visible) return undefined;
    return object.userData.xrAction as XrPanelAction | undefined;
  }

  clearHover() {
    this.selectors.forEach(({ mesh }) => mesh.material.color.setHex(0xffffff));
  }

  setHovered(action: XrPanelAction) {
    this.selectors.find((selector) => selector.action === action)?.mesh.material.color.setHex(0x8be7ff);
  }

  dispose() {
    this.matrixMesh.geometry.dispose();
    this.matrixTexture.dispose();
    this.matrixMesh.material.dispose();
    this.selectors.forEach(({ mesh, texture }) => {
      mesh.geometry.dispose();
      texture.dispose();
      mesh.material.dispose();
    });
    this.root.clear();
  }

  private updateSelectors(qubitCount: number, activePair: [number, number]) {
    const visibleSelectors = qubitCount >= 3 ? this.selectors : this.selectors.slice(0, qubitCount >= 2 ? 1 : 0);
    const gap = 0.014;
    const width = qubitCount >= 3 ? 0.145 : 0.18;
    const totalWidth = width * visibleSelectors.length + gap * Math.max(0, visibleSelectors.length - 1);
    let cursor = -totalWidth / 2;
    this.selectors.forEach((selector) => {
      const visible = visibleSelectors.includes(selector);
      selector.mesh.visible = visible;
      if (!visible) return;
      selector.mesh.scale.x = width / 0.145;
      selector.mesh.position.set(cursor + width / 2, 0.235, 0);
      const active = samePair(selector.pair, activePair);
      drawSelector(selector, active);
      cursor += width + gap;
    });
  }
}

function createSelectorSurface() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.145, 0.09, 0.022),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, transparent: true }),
  );
  return { mesh, texture, canvas };
}

function drawSelector(selector: SelectorButton, active: boolean) {
  const context = selector.canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, selector.canvas.width, selector.canvas.height);
  context.fillStyle = active ? "#92400e" : "#29445f";
  context.fillRect(0, 0, selector.canvas.width, selector.canvas.height);
  context.strokeStyle = active ? "#fbbf24" : "#52667e";
  context.lineWidth = 7;
  context.strokeRect(3, 3, selector.canvas.width - 6, selector.canvas.height - 6);
  context.fillStyle = "#f6f7fb";
  context.font = "850 48px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(selector.label, selector.canvas.width / 2, selector.canvas.height / 2 + 1);
  selector.texture.needsUpdate = true;
}

function drawMatrix(
  canvas: HTMLCanvasElement,
  texture: THREE.CanvasTexture,
  matrix: number[][],
  pair: [number, number],
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(7, 16, 31, 0.96)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(139, 231, 255, 0.52)";
  context.lineWidth = 7;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  context.fillStyle = "#dfe8f7";
  context.font = "850 42px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`CORRELATION  q${pair[0]}/q${pair[1]}`, canvas.width / 2, 54);

  const left = 116;
  const top = 118;
  const cellWidth = 158;
  const cellHeight = 126;
  context.font = "850 36px system-ui, sans-serif";
  AXIS_LABELS.forEach((label, index) => {
    context.fillStyle = "#9fb0c9";
    context.fillText(label, left + cellWidth * (index + 0.5), top - 34);
    context.fillText(label, left - 42, top + cellHeight * (index + 0.5));
  });

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const value = matrix[row]?.[column] ?? 0;
      const intensity = Math.min(1, Math.abs(value));
      const x = left + column * cellWidth;
      const y = top + row * cellHeight;
      context.fillStyle = value >= 0
        ? `rgba(14, 116, 144, ${0.22 + intensity * 0.7})`
        : `rgba(146, 64, 14, ${0.22 + intensity * 0.7})`;
      context.fillRect(x + 4, y + 4, cellWidth - 8, cellHeight - 8);
      context.strokeStyle = "rgba(159, 176, 201, 0.42)";
      context.lineWidth = 3;
      context.strokeRect(x + 4, y + 4, cellWidth - 8, cellHeight - 8);
      context.fillStyle = "#f6f7fb";
      context.font = "800 34px ui-monospace, monospace";
      context.fillText(value.toFixed(2), x + cellWidth / 2, y + cellHeight / 2 + 2);
    }
  }
  texture.needsUpdate = true;
}

function samePair(first: [number, number], second: [number, number]) {
  return first[0] === second[0] && first[1] === second[1];
}
