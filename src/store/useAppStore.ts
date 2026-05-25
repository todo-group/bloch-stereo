import { create } from "zustand";
import type { Circuit, DisplayMode, ExecutionState, GateName, GateOp } from "../circuit/types";
import { exportQasm2 } from "../circuit/qasm2/exporter";
import { parseQasm2 } from "../circuit/qasm2/parser";
import { executeCircuit } from "../circuit/simulator/simulator";
import { teleportationQasm } from "../presets/teleportation";

export type ForcedBranch = "random" | "00" | "01" | "10" | "11";

type AppState = {
  circuit: Circuit;
  qasmText: string;
  snapshots: ExecutionState[];
  currentStep: number;
  displayMode: DisplayMode;
  autoplay: boolean;
  selectedGate: GateName;
  targetQubit: number;
  controlQubit: number;
  forcedBranch: ForcedBranch;
  error?: string;
  setQasmText: (value: string) => void;
  importQasm: () => void;
  exportCircuit: () => void;
  loadTeleportation: () => void;
  addGate: () => void;
  deleteGate: (opId: string) => void;
  resetExecution: () => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  toggleAutoplay: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setSelectedGate: (gate: GateName) => void;
  setTargetQubit: (qubit: number) => void;
  setControlQubit: (qubit: number) => void;
  setForcedBranch: (branch: ForcedBranch) => void;
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
  snapshots: recalculate(initialCircuit, "random"),
  currentStep: 0,
  displayMode: "2d",
  autoplay: false,
  selectedGate: "h",
  targetQubit: 0,
  controlQubit: 0,
  forcedBranch: "random",

  setQasmText: (value) => set({ qasmText: value, error: undefined }),

  importQasm: () => {
    try {
      const circuit = parseQasm2(get().qasmText);
      set({
        circuit,
        snapshots: recalculate(circuit, get().forcedBranch),
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

  loadTeleportation: () => {
    const circuit = parseQasm2(teleportationQasm);
    set({
      circuit,
      qasmText: teleportationQasm,
      snapshots: recalculate(circuit, get().forcedBranch),
      currentStep: 0,
      autoplay: false,
      targetQubit: 0,
      controlQubit: 1,
      error: undefined,
    });
  },

  addGate: () => {
    const state = get();
    const result = makeGateOp(
      state.selectedGate,
      state.circuit.ops.length,
      state.targetQubit,
      state.controlQubit,
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
      snapshots: recalculate(circuit, state.forcedBranch),
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
    const snapshots = recalculate(circuit, state.forcedBranch);
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
    set({
      currentStep: Math.min(state.currentStep + 1, state.snapshots.length - 1),
      autoplay: state.currentStep + 1 < state.snapshots.length - 1 ? state.autoplay : false,
    });
  },
  previousStep: () => {
    const state = get();
    set({ currentStep: Math.max(state.currentStep - 1, 0), autoplay: false });
  },
  setStep: (step) => set(({ snapshots }) => ({ currentStep: clamp(step, 0, snapshots.length - 1), autoplay: false })),
  toggleAutoplay: () => set(({ autoplay }) => ({ autoplay: !autoplay })),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setSelectedGate: (gate) => set({ selectedGate: gate }),
  setTargetQubit: (qubit) => set({ targetQubit: qubit }),
  setControlQubit: (qubit) => set({ controlQubit: qubit }),
  setForcedBranch: (branch) => {
    const state = get();
    set({
      forcedBranch: branch,
      snapshots: recalculate(state.circuit, branch),
      currentStep: 0,
      autoplay: false,
    });
  },
}));

function recalculate(circuit: Circuit, forcedBranch: ForcedBranch): ExecutionState[] {
  return executeCircuit(circuit, { forcedMeasurements: branchToForcedMeasurements(forcedBranch) });
}

function branchToForcedMeasurements(branch: ForcedBranch): Array<0 | 1> | undefined {
  if (branch === "random") return undefined;
  const value = Number.parseInt(branch, 2);
  return [(value & 1) as 0 | 1, ((value >> 1) & 1) as 0 | 1];
}

type GateOpResult =
  | { ok: true; op: GateOp }
  | { ok: false; error: string };

function makeGateOp(
  name: GateName,
  step: number,
  target: number,
  control: number,
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
  const params = name === "rx" || name === "ry" || name === "rz" ? [Math.PI / 2] : undefined;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
