import { describe, expect, it } from "vitest";
import { parseQasm2 } from "./parser";

describe("OpenQASM 2 parser", () => {
  it("rejects out-of-range qubits instead of silently clamping the circuit", () => {
    expect(() =>
      parseQasm2(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[9];
creg c[1];
`),
    ).toThrow(/qreg size/);

    expect(() =>
      parseQasm2(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[1];
x q[2];
`),
    ).toThrow(/Invalid qubit index/);
  });

  it("rejects conditionals that target an unsupported classical register", () => {
    expect(() =>
      parseQasm2(`OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[1];
if (flag==1) x q[0];
`),
    ).toThrow(/Unsupported conditional register/);
  });
});
