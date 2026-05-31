import { create } from "zustand";
import type { Circuit, DisplayMode, ExecutionState, GateName, GateOp, SimulationBackend, StereoSettings } from "../circuit/types";
import { exportQasm2 } from "../circuit/qasm2/exporter";
import { parseQasm2 } from "../circuit/qasm2/parser";
import { executeCircuit } from "../circuit/simulator/simulator";
import {
  bellQasm,
  createRandomSwapQasm,
  createTeleportationQasm,
  ghzQasm,
  hCzMeasureQasm,
  mixedProductQasm,
  zeroQasm,
  zeroZeroQasm,
  zeroZeroZeroQasm,
} from "../presets/teleportation";

export type PresetName =
  | "zero"
  | "zero-zero"
  | "zero-zero-zero"
  | "bell"
  | "mixed-product"
  | "ghz"
  | "h-cz-measure"
  | "random-swap"
  | "teleportation";

type AppState = {
  circuit: Circuit;
  qasmText: string;
  snapshots: ExecutionState[];
  currentStep: number;
  displayMode: DisplayMode;
  simulationBackend: SimulationBackend;
  stereoSettings: StereoSettings;
  autoplay: boolean;
  selectedGate: GateName;
  rotationAngleDegrees: number;
  noiseProbability: number;
  targetQubit: number;
  controlQubit: number;
  error?: string;
  setQasmText: (value: string) => void;
  importQasm: () => void;
  exportCircuit: () => void;
  loadPreset: (preset: PresetName) => void;
  loadTeleportation: () => void;
  addGate: () => void;
  deleteGate: (opId: string) => void;
  resetExecution: () => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  toggleAutoplay: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setSimulationBackend: (backend: SimulationBackend) => void;
  setStereoSettings: (settings: Partial<StereoSettings>) => void;
  setSelectedGate: (gate: GateName) => void;
  setRotationAngleDegrees: (degrees: number) => void;
  setNoiseProbability: (probability: number) => void;
  setTargetQubit: (qubit: number) => void;
  setControlQubit: (qubit: number) => void;
};

const starterQasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
`;

const initialCircuit = parseQasm2(starterQasm);

export const useAppStore = create<AppState>((set, get) => ({
  circuit: initialCircuit,
  qasmText: starterQasm,
  snapshots: recalculate(initialCircuit),
  currentStep: 0,
  displayMode: "2d",
  simulationBackend: "density-matrix",
  stereoSettings: {
    enabled: false,
    eyeSeparation: 0.12,
    convergenceDistance: 4.2,
    redGain: 1,
    cyanGain: 0.82,
    preserveBrightness: false,
  },
  autoplay: false,
  selectedGate: "h",
  rotationAngleDegrees: 90,
  noiseProbability: 0.25,
  targetQubit: 0,
  controlQubit: 0,

  setQasmText: (value) => set({ qasmText: value, error: undefined }),

  importQasm: () => {
    try {
      const circuit = parseQasm2(get().qasmText);
      set({
        circuit,
        snapshots: recalculate(circuit, get().simulationBackend),
        currentStep: 0,
        autoplay: false,
        targetQubit: clamp(get().targetQubit, 0, circuit.numQubits - 1),
        controlQubit: clamp(get().controlQubit, 0, circuit.numQubits - 1),
        error: undefined,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error), autoplay: false });
    }
  },

  exportCircuit: () => set(({ circuit }) => ({ qasmText: exportQasm2(circuit), error: undefined })),

  loadPreset: (preset) => {
    const qasm = makePresetQasm(preset);
    const circuit = parseQasm2(qasm);
    set({
      circuit,
      qasmText: qasm,
      snapshots: recalculate(circuit, get().simulationBackend),
      currentStep: 0,
      autoplay: false,
      targetQubit: 0,
      controlQubit: Math.min(1, circuit.numQubits - 1),
      error: undefined,
    });
  },
  loadTeleportation: () => get().loadPreset("teleportation"),

  addGate: () => {
    const state = get();
    const result = makeGateOp(
      state.selectedGate,
      state.circuit.ops.length,
      state.targetQubit,
      state.controlQubit,
      state.rotationAngleDegrees,
      state.noiseProbability,
      state.circuit.numQubits,
      state.circuit.numClbits,
    );
    if (!result.ok) {
      set({ error: result.error, autoplay: false });
      return;
    }
    const op = result.op;
    const circuit = { ...state.circuit, ops: [...state.circuit.ops, op] };
    set({
      circuit,
      qasmText: exportQasm2(circuit),
      snapshots: recalculate(circuit, state.simulationBackend),
      currentStep: circuit.ops.length,
      error: undefined,
    });
  },

  deleteGate: (opId) => {
    const state = get();
    const ops = state.circuit.ops
      .filter((op) => op.id !== opId)
      .map((op, index) => ({ ...op, step: index }));
    const circuit = { ...state.circuit, ops };
    const snapshots = recalculate(circuit, state.simulationBackend);
    set({
      circuit,
      qasmText: exportQasm2(circuit),
      snapshots,
      currentStep: Math.min(state.currentStep, snapshots.length - 1),
      autoplay: false,
      error: undefined,
    });
  },

  resetExecution: () => set({ currentStep: 0, autoplay: false }),
  nextStep: () => {
    const state = get();
    const nextStep = Math.min(state.currentStep + 1, state.snapshots.length - 1);
    const snapshots = shouldResampleOnStep(state, nextStep)
      ? recalculate(state.circuit, state.simulationBackend, fixedMeasurementsBeforeCurrentStep(state))
      : state.snapshots;
    set({
      snapshots,
      currentStep: nextStep,
      autoplay: nextStep < snapshots.length - 1 ? state.autoplay : false,
    });
  },
  previousStep: () => {
    const state = get();
    set({ currentStep: Math.max(state.currentStep - 1, 0), autoplay: false });
  },
  setStep: (step) => {
    const state = get();
    const nextStep = clamp(step, 0, state.snapshots.length - 1);
    const snapshots = shouldResampleOnStep(state, nextStep)
      ? recalculate(state.circuit, state.simulationBackend, fixedMeasurementsBeforeCurrentStep(state))
      : state.snapshots;
    set({ snapshots, currentStep: nextStep, autoplay: false });
  },
  toggleAutoplay: () => set(({ autoplay }) => ({ autoplay: !autoplay })),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setSimulationBackend: (backend) => {
    const state = get();
    set({
      simulationBackend: backend,
      snapshots: recalculate(state.circuit, backend),
      currentStep: 0,
      autoplay: false,
    });
  },
  setStereoSettings: (settings) => set((state) => ({ stereoSettings: { ...state.stereoSettings, ...settings } })),
  setSelectedGate: (gate) => set({ selectedGate: gate }),
  setRotationAngleDegrees: (degrees) => set({ rotationAngleDegrees: Number.isFinite(degrees) ? degrees : 0 }),
  setNoiseProbability: (probability) => set({ noiseProbability: clamp(Number.isFinite(probability) ? probability : 0, 0, 1) }),
  setTargetQubit: (qubit) => set({ targetQubit: qubit }),
  setControlQubit: (qubit) => set({ controlQubit: qubit }),
}));

function makePresetQasm(preset: PresetName): string {
  if (preset === "zero") return zeroQasm;
  if (preset === "zero-zero") return zeroZeroQasm;
  if (preset === "zero-zero-zero") return zeroZeroZeroQasm;
  if (preset === "bell") return bellQasm;
  if (preset === "mixed-product") return mixedProductQasm;
  if (preset === "ghz") return ghzQasm;
  if (preset === "h-cz-measure") return hCzMeasureQasm;
  if (preset === "random-swap") return createRandomSwapQasm();
  return createTeleportationQasm();
}

function shouldResampleOnStep(state: AppState, nextStep: number): boolean {
  if (nextStep <= state.currentStep) return false;
  return state.snapshots
    .slice(state.currentStep + 1, nextStep + 1)
    .some((snapshot) => snapshot.appliedOp?.name === "measure");
}

function fixedMeasurementsBeforeCurrentStep(state: AppState): Array<0 | 1> {
  const snapshot = state.snapshots[state.currentStep];
  return snapshot.measurementLog.map((record) => record.value);
}

function recalculate(
  circuit: Circuit,
  backend: SimulationBackend = "density-matrix",
  forcedMeasurements?: Array<0 | 1>,
): ExecutionState[] {
  return executeCircuit(circuit, { backend, forcedMeasurements });
}

type GateOpResult =
  | { ok: true; op: GateOp }
  | { ok: false; error: string };

function makeGateOp(
  name: GateName,
  step: number,
  target: number,
  control: number,
  rotationAngleDegrees: number,
  noiseProbability: number,
  numQubits: number,
  numClbits: number,
): GateOpResult {
  if (target < 0 || target >= numQubits) {
    return { ok: false, error: `Target q${target} is outside the circuit.` };
  }
  const fallbackQubit = target === 0 ? Math.min(1, numQubits - 1) : 0;
  if (name === "cx" || name === "cz") {
    if (numQubits < 2) return { ok: false, error: `${name.toUpperCase()} requires at least 2 qubits.` };
    return {
      ok: true,
      op: {
        id: `op-${Date.now()}-${step}`,
        name,
        controls: [control === target ? fallbackQubit : control],
        targets: [target],
        step,
      },
    };
  }
  if (name === "swap") {
    if (numQubits < 2) return { ok: false, error: "SWAP requires at least 2 qubits." };
    return {
      ok: true,
      op: {
        id: `op-${Date.now()}-${step}`,
        name,
        targets: [control === target ? fallbackQubit : control, target],
        step,
      },
    };
  }
  if (name === "measure") {
    return {
      ok: true,
      op: {
        id: `op-${Date.now()}-${step}`,
        name,
        targets: [target],
        clbits: [Math.min(target, numClbits - 1)],
        step,
      },
    };
  }
  const params = isRotationGate(name)
    ? [degreesToRadians(rotationAngleDegrees)]
    : isNoiseGate(name)
      ? [clamp(noiseProbability, 0, 1)]
      : undefined;
  return {
    ok: true,
    op: {
      id: `op-${Date.now()}-${step}`,
      name,
      targets: [target],
      params,
      step,
    },
  };
}

function isRotationGate(name: GateName): boolean {
  return name === "rx" || name === "ry" || name === "rz";
}

function isNoiseGate(name: GateName): boolean {
  return name === "depolarize" || name === "dephase" || name === "ampdamp";
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
