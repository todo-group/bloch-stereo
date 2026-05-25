import { describe, expect, it } from "vitest";
import { parseQasm2 } from "../qasm2/parser";
import { executeCircuit } from "./simulator";
import { blochVectorsForState, correlationMatrix } from "./density";
import { teleportationQasm } from "../../presets/teleportation";
import type { ExecutionState } from "../types";

describe("statevector execution", () => {
  it("creates Bell-state correlations without normalizing reduced Bloch vectors", () => {
    const circuit = parseQasm2(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
`);

    const final = lastSnapshot(executeCircuit(circuit));
    expect(final).toBeDefined();
    const vectors = blochVectorsForState(final!.statevector, circuit.numQubits);
    expect(vectors[0].purity).toBeCloseTo(0.5);
    expect(vectors[1].purity).toBeCloseTo(0.5);

    const correlations = correlationMatrix(final!.statevector, circuit.numQubits, 0, 1);
    expect(correlations[0][0]).toBeCloseTo(1);
    expect(correlations[1][1]).toBeCloseTo(-1);
    expect(correlations[2][2]).toBeCloseTo(1);
  });

  it("collapses measurement into the forced branch and updates classical bits", () => {
    const circuit = parseQasm2(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[1];
h q[0];
measure q[0] -> c[0];
`);

    const final = lastSnapshot(executeCircuit(circuit, { forcedMeasurements: [1] }));
    expect(final?.classicalBits).toEqual([1]);
    expect(final?.measurementLog[0]).toMatchObject({ qubit: 0, clbit: 0, value: 1 });
    expect(final?.measurementLog[0].probability).toBeCloseTo(0.5);

    const vector = blochVectorsForState(final!.statevector, circuit.numQubits)[0];
    expect(vector.z).toBeCloseTo(-1);
  });

  it("keeps teleportation correction branches aligned with c0/c1 bit order", () => {
    const circuit = parseQasm2(teleportationQasm);
    const branches: Array<[Array<0 | 1>, number]> = [
      [[0, 0], 0],
      [[1, 0], 1],
      [[0, 1], 2],
      [[1, 1], 3],
    ];

    branches.forEach(([forced, expectedClassicalValue]) => {
      const final = lastSnapshot(executeCircuit(circuit, { forcedMeasurements: forced }));
      const actual = final!.classicalBits.reduce(
        (value: number, bit: number, index: number) => value + (bit << index),
        0,
      );
      expect(actual).toBe(expectedClassicalValue);
      const target = blochVectorsForState(final!.statevector, circuit.numQubits)[2];
      expect(target.x).toBeCloseTo(1);
      expect(target.y).toBeCloseTo(0);
      expect(target.z).toBeCloseTo(0);
    });
  });
});

function lastSnapshot(snapshots: ExecutionState[]): ExecutionState | undefined {
  return snapshots[snapshots.length - 1];
}
