import * as THREE from "three";
import type { Circuit, GateName, GateOp } from "../circuit/types";

const CANVAS_WIDTH = 1536;
const CANVAS_HEIGHT = 448;
const MAX_VISIBLE_OPERATIONS = 11;
const DIAGRAM_LEFT = 132;
const DIAGRAM_RIGHT = CANVAS_WIDTH - 42;
const DIAGRAM_TOP = 112;
const DIAGRAM_BOTTOM = CANVAS_HEIGHT - 42;

export type CircuitWindow = {
  start: number;
  end: number;
};

export function getCircuitRowPositions(qubitCount: number): number[] {
  const count = Math.max(1, qubitCount);
  if (count === 1) return [(DIAGRAM_TOP + DIAGRAM_BOTTOM) / 2];
  const availableHeight = DIAGRAM_BOTTOM - DIAGRAM_TOP;
  const occupiedHeight = count === 2 ? availableHeight / 2 : availableHeight;
  const firstRow = (DIAGRAM_TOP + DIAGRAM_BOTTOM - occupiedHeight) / 2;
  const spacing = occupiedHeight / (count - 1);
  return Array.from({ length: count }, (_, qubit) => firstRow + qubit * spacing);
}

export function selectCircuitWindow(
  totalOperations: number,
  currentStep: number,
  maxVisible = MAX_VISIBLE_OPERATIONS,
): CircuitWindow {
  if (totalOperations <= maxVisible) return { start: 0, end: totalOperations };
  const currentIndex = clamp(currentStep - 1, 0, totalOperations - 1);
  const start = clamp(currentIndex - Math.floor(maxVisible / 2), 0, totalOperations - maxVisible);
  return { start, end: start + maxVisible };
}

export class XrCircuitPanel {
  readonly root = new THREE.Group();

  private readonly mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  private readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;

  constructor(circuit: Circuit, currentStep: number) {
    this.root.name = "xr-circuit-panel";
    this.canvas = document.createElement("canvas");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 0.46, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xffffff, map: this.texture, transparent: true }),
    );
    this.mesh.name = "xr-circuit-surface";
    this.root.add(this.mesh);
    this.update(circuit, currentStep);
  }

  update(circuit: Circuit, currentStep: number) {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    drawCircuit(context, circuit, currentStep);
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.texture.dispose();
    this.mesh.material.dispose();
    this.root.clear();
  }
}

function drawCircuit(context: CanvasRenderingContext2D, circuit: Circuit, currentStep: number) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = "rgba(7, 16, 31, 0.96)";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.strokeStyle = "rgba(139, 231, 255, 0.42)";
  context.lineWidth = 4;
  context.strokeRect(3, 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - 6);

  context.fillStyle = "#9fb0c9";
  context.font = "800 34px system-ui, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("QUANTUM CIRCUIT", 34, 54);
  context.textAlign = "right";
  context.fillText(`GATE ${currentStep} / ${circuit.ops.length}`, CANVAS_WIDTH - 34, 54);

  const qubitCount = Math.max(1, circuit.numQubits);
  const rowPositions = getCircuitRowPositions(qubitCount);
  const rowSpacing = qubitCount === 1 ? 0 : rowPositions[1] - rowPositions[0];
  const wireY = (qubit: number) => rowPositions[qubit] ?? rowPositions[0];

  context.font = "700 30px system-ui, sans-serif";
  context.textAlign = "left";
  for (let qubit = 0; qubit < qubitCount; qubit += 1) {
    const y = wireY(qubit);
    context.fillStyle = "#dff7ff";
    context.fillText(`q${qubit}`, 34, y);
    context.strokeStyle = "rgba(159, 176, 201, 0.72)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(DIAGRAM_LEFT, y);
    context.lineTo(DIAGRAM_RIGHT, y);
    context.stroke();
    context.fillStyle = "#7dd3fc";
    context.font = "700 24px system-ui, sans-serif";
    context.fillText("|0〉", 76, y);
    context.font = "700 30px system-ui, sans-serif";
  }

  if (circuit.ops.length === 0) {
    return;
  }

  const window = selectCircuitWindow(circuit.ops.length, currentStep);
  const visibleOperations = circuit.ops.slice(window.start, window.end);
  const slotWidth = (DIAGRAM_RIGHT - DIAGRAM_LEFT) / MAX_VISIBLE_OPERATIONS;
  visibleOperations.forEach((operation, localIndex) => {
    const x = DIAGRAM_LEFT + slotWidth * (localIndex + 0.5);
    const operationIndex = window.start + localIndex;
    drawOperation(context, operation, x, wireY, rowSpacing || 76, currentStep === operationIndex + 1);
  });

  context.fillStyle = "#9fb0c9";
  context.font = "900 36px system-ui, sans-serif";
  context.textAlign = "center";
  if (window.start > 0) context.fillText("…", DIAGRAM_LEFT - 10, (DIAGRAM_TOP + DIAGRAM_BOTTOM) / 2);
  if (window.end < circuit.ops.length) context.fillText("…", DIAGRAM_RIGHT + 10, (DIAGRAM_TOP + DIAGRAM_BOTTOM) / 2);
}

function drawOperation(
  context: CanvasRenderingContext2D,
  operation: GateOp,
  x: number,
  wireY: (qubit: number) => number,
  rowSpacing: number,
  current: boolean,
) {
  if (operation.name === "cx" || operation.name === "cz") {
    const controlY = wireY(operation.controls?.[0] ?? 0);
    const targetY = wireY(operation.targets[0] ?? 0);
    drawConnector(context, x, controlY, targetY, current);
    context.fillStyle = current ? "#f59e0b" : "#dff7ff";
    context.beginPath();
    context.arc(x, controlY, Math.min(11, rowSpacing * 0.14), 0, Math.PI * 2);
    context.fill();
    if (operation.name === "cx") drawTarget(context, x, targetY, rowSpacing, current);
    else drawGateBox(context, x, targetY, "CZ", rowSpacing, current);
    return;
  }

  if (operation.name === "swap") {
    const firstY = wireY(operation.targets[0] ?? 0);
    const secondY = wireY(operation.targets[1] ?? operation.targets[0] ?? 0);
    drawConnector(context, x, firstY, secondY, current);
    drawSwap(context, x, firstY, rowSpacing, current);
    drawSwap(context, x, secondY, rowSpacing, current);
    return;
  }

  const y = wireY(operation.targets[0] ?? 0);
  if (isNoiseGate(operation.name)) {
    drawNoiseGate(context, x, y, formatGateLabel(operation.name), rowSpacing, current);
  } else if (operation.name === "measure") {
    drawMeasurement(context, x, y, rowSpacing, current);
  } else {
    drawGateBox(context, x, y, formatGateLabel(operation.name), rowSpacing, current);
  }
}

function drawConnector(context: CanvasRenderingContext2D, x: number, firstY: number, secondY: number, current: boolean) {
  context.strokeStyle = current ? "#fbbf24" : "#b8dfff";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x, firstY);
  context.lineTo(x, secondY);
  context.stroke();
}

function drawGateBox(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  rowSpacing: number,
  current: boolean,
) {
  const size = clamp(rowSpacing * 0.72, 30, 58);
  context.fillStyle = current ? "#c56a10" : "#29445f";
  context.strokeStyle = current ? "#fbbf24" : "#8be7ff";
  context.lineWidth = current ? 6 : 4;
  context.fillRect(x - size / 2, y - size / 2, size, size);
  context.strokeRect(x - size / 2, y - size / 2, size, size);
  context.fillStyle = current ? "#fff7ed" : "#dff7ff";
  context.font = `900 ${clamp(size * 0.43, 15, 25)}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y + 1);
}

function drawNoiseGate(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  rowSpacing: number,
  current: boolean,
) {
  const size = clamp(rowSpacing * 0.64, 28, 52);
  context.fillStyle = current ? "#9a4e0a" : "#182f49";
  context.strokeStyle = current ? "#fbbf24" : "#8be7ff";
  context.lineWidth = 4;
  context.fillRect(x - size / 2 + 7, y - size / 2 - 7, size, size);
  context.strokeRect(x - size / 2 + 7, y - size / 2 - 7, size, size);
  context.fillStyle = current ? "#c56a10" : "#29445f";
  context.fillRect(x - size / 2 - 5, y - size / 2 + 5, size, size);
  context.strokeRect(x - size / 2 - 5, y - size / 2 + 5, size, size);
  context.fillStyle = current ? "#fff7ed" : "#dff7ff";
  context.font = `900 ${clamp(size * 0.36, 13, 20)}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x - 5, y + 5);
}

function drawMeasurement(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rowSpacing: number,
  current: boolean,
) {
  const size = clamp(rowSpacing * 0.72, 30, 58);
  context.fillStyle = current ? "#c56a10" : "#29445f";
  context.strokeStyle = current ? "#fbbf24" : "#8be7ff";
  context.lineWidth = current ? 6 : 4;
  context.fillRect(x - size / 2, y - size / 2, size, size);
  context.strokeRect(x - size / 2, y - size / 2, size, size);
  context.strokeStyle = current ? "#fff7ed" : "#dff7ff";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(x, y + size * 0.18, size * 0.3, Math.PI, 0);
  context.stroke();
  context.beginPath();
  context.moveTo(x, y + size * 0.18);
  context.lineTo(x + size * 0.18, y - size * 0.12);
  context.stroke();
}

function drawTarget(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rowSpacing: number,
  current: boolean,
) {
  const radius = clamp(rowSpacing * 0.27, 12, 22);
  context.fillStyle = current ? "#fed7aa" : "#29445f";
  context.strokeStyle = current ? "#f59e0b" : "#8be7ff";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(x - radius * 0.68, y);
  context.lineTo(x + radius * 0.68, y);
  context.moveTo(x, y - radius * 0.68);
  context.lineTo(x, y + radius * 0.68);
  context.stroke();
}

function drawSwap(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rowSpacing: number,
  current: boolean,
) {
  const radius = clamp(rowSpacing * 0.22, 11, 19);
  context.strokeStyle = current ? "#fbbf24" : "#dff7ff";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x - radius, y - radius);
  context.lineTo(x + radius, y + radius);
  context.moveTo(x + radius, y - radius);
  context.lineTo(x - radius, y + radius);
  context.stroke();
}

function formatGateLabel(gate: GateName): string {
  if (gate === "sdg") return "S+";
  if (gate === "tdg") return "T+";
  if (gate === "depolarize") return "XYZ≈";
  if (gate === "dephase") return "Z≈";
  if (gate === "ampdamp") return "↓";
  return gate.toUpperCase();
}

function isNoiseGate(gate: GateName): boolean {
  return gate === "depolarize" || gate === "dephase" || gate === "ampdamp";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
