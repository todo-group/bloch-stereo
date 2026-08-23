import { describe, expect, it } from "vitest";
import { getCircuitRowPositions, selectCircuitWindow } from "./XrCircuitPanel";

describe("selectCircuitWindow", () => {
  it("shows every operation when the circuit is short", () => {
    expect(selectCircuitWindow(6, 4)).toEqual({ start: 0, end: 6 });
  });

  it("keeps the current operation near the center of a long circuit", () => {
    expect(selectCircuitWindow(30, 16, 9)).toEqual({ start: 11, end: 20 });
  });

  it("clamps the window at both ends of a long circuit", () => {
    expect(selectCircuitWindow(30, 1, 9)).toEqual({ start: 0, end: 9 });
    expect(selectCircuitWindow(30, 30, 9)).toEqual({ start: 21, end: 30 });
  });
});

describe("getCircuitRowPositions", () => {
  it("uses half of the available height for two qubits", () => {
    const rows = getCircuitRowPositions(2);
    expect(rows[1] - rows[0]).toBeCloseTo(147);
  });

  it("keeps three qubits evenly distributed over the available height", () => {
    const rows = getCircuitRowPositions(3);
    expect(rows[1] - rows[0]).toBeCloseTo(147);
    expect(rows[2] - rows[1]).toBeCloseTo(147);
  });
});
