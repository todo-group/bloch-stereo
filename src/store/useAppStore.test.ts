import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "./useAppStore";
import { DEFAULT_STEREO_SETTINGS } from "../circuit/types";

describe("execution navigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
