import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "./useAppStore";
import { DEFAULT_STEREO_SETTINGS } from "../circuit/types";

afterEach(() => {
  vi.restoreAllMocks();
  useAppStore.setState({ userPresets: [] });
  useAppStore.getState().loadPreset("zero");
});

describe("initial circuit", () => {
  it("starts from the one-qubit zero preset without gates", () => {
    useAppStore.getState().loadPreset("zero");
    const state = useAppStore.getState();
    expect(state.selectedPreset).toBe("zero");
    expect(state.circuit.numQubits).toBe(1);
    expect(state.circuit.ops).toHaveLength(0);
  });
});

describe("execution navigation", () => {

  it("preserves prior measurement outcomes when sampling the next measurement", () => {
    const randomValues = [
      0.1,
      0.1,
      0.1,
      0.1,
      0.9,
      0.9,
      0.25,
      0.9,
    ];
    vi.spyOn(Math, "random").mockImplementation(() => randomValues.shift() ?? 0.9);

    const store = useAppStore.getState();
    store.setQasmText(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
measure q[0] -> c[0];
h q[1];
measure q[1] -> c[1];
`);
    store.importQasm();

    useAppStore.getState().nextStep();
    useAppStore.getState().nextStep();
    expect(useAppStore.getState().snapshots[2].measurementLog.map((record) => record.value)).toEqual([1]);

    useAppStore.getState().nextStep();
    useAppStore.getState().nextStep();
    expect(useAppStore.getState().snapshots[4].measurementLog.map((record) => record.value)).toEqual([1, 0]);
  });
});

describe("preset selection", () => {
  it("keeps the selected preset visible until the circuit is edited manually", () => {
    useAppStore.getState().loadPreset("ghz");

    expect(useAppStore.getState().selectedPreset).toBe("ghz");

    useAppStore.getState().setQasmText(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[1];
`);

    expect(useAppStore.getState().selectedPreset).toBeUndefined();
  });

  it.each([
    ["bell", 2],
    ["mixed-product", 2],
    ["ghz", 3],
  ] as const)("adds final measurements to %s", (preset, qubits) => {
    useAppStore.getState().loadPreset(preset);
    const finalOps = useAppStore.getState().circuit.ops.slice(-qubits);
    expect(finalOps.map((op) => op.name)).toEqual(Array.from({ length: qubits }, () => "measure"));
    expect(finalOps.map((op) => op.targets[0])).toEqual(Array.from({ length: qubits }, (_, index) => index));
  });

  it("saves sequential user-defined presets and reloads their circuits", () => {
    useAppStore.getState().loadPreset("zero-zero");
    useAppStore.getState().saveUserPreset();
    const savedPreset = useAppStore.getState().userPresets[0];

    expect(savedPreset.label).toBe("User Defined 1");
    expect(useAppStore.getState().selectedPreset).toBe("user-1");

    useAppStore.getState().saveUserPreset();
    expect(useAppStore.getState().userPresets[1].label).toBe("User Defined 2");

    useAppStore.getState().loadPreset("zero");
    useAppStore.getState().loadPreset(savedPreset.value);
    expect(useAppStore.getState().circuit.numQubits).toBe(2);
  });
});

describe("stereo calibration", () => {
  it("resets stereo settings to their defaults", () => {
    useAppStore.getState().setStereoSettings({
      eyeSeparation: 0.2,
      convergenceDistance: 6,
      redGain: 0.5,
      cyanGain: 0.5,
    });

    useAppStore.getState().resetStereoSettings();

    expect(useAppStore.getState().stereoSettings).toEqual(DEFAULT_STEREO_SETTINGS);
  });
});

describe("correlation selection", () => {
  it("keeps XR and desktop correlation selection in validated shared state", () => {
    useAppStore.getState().loadPreset("ghz");
    useAppStore.getState().setCorrelationPair([1, 2]);

    expect(useAppStore.getState().correlationPair).toEqual([1, 2]);

    useAppStore.getState().setCorrelationPair([2, 2]);
    expect(useAppStore.getState().correlationPair).toEqual([1, 2]);
  });
});
