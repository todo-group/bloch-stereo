import type { Circuit, GateOp } from "../types";

export function exportQasm2(circuit: Circuit): string {
  const lines = [
    "OPENQASM 2.0;",
    'include "qelib1.inc";',
    `qreg q[${circuit.numQubits}];`,
    `creg c[${circuit.numClbits}];`,
    ...circuit.ops.map(formatOp),
  ];
  return `${lines.join("\n")}\n`;
}

function formatOp(op: GateOp): string {
  const prefix = op.condition ? `if (${op.condition.register}==${op.condition.value}) ` : "";
  if (op.name === "measure") {
    return `${prefix}measure q[${op.targets[0]}] -> c[${op.clbits?.[0] ?? 0}];`;
  }
  if (op.name === "cx" || op.name === "cz") {
    return `${prefix}${op.name} q[${op.controls?.[0] ?? 0}], q[${op.targets[0]}];`;
  }
  if (op.name === "swap") {
    return `${prefix}swap q[${op.targets[0]}], q[${op.targets[1]}];`;
  }
  const params = op.params?.length ? `(${formatAngle(op.params[0])})` : "";
  return `${prefix}${op.name}${params} q[${op.targets[0]}];`;
}

function formatAngle(value: number): string {
  const piRatio = value / Math.PI;
  if (Math.abs(piRatio - 1) < 1e-8) return "pi";
  if (Math.abs(piRatio + 1) < 1e-8) return "-pi";
  if (Math.abs(piRatio - 0.5) < 1e-8) return "pi/2";
  if (Math.abs(piRatio + 0.5) < 1e-8) return "-pi/2";
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
