import type { Circuit, GateName, GateOp } from "../types";

const GATES = new Set<GateName>([
  "id",
  "x",
  "y",
  "z",
  "h",
  "s",
  "sdg",
  "t",
  "tdg",
  "rx",
  "ry",
  "rz",
  "cx",
  "cz",
  "swap",
  "measure",
]);

export function parseQasm2(source: string): Circuit {
  const statements = source
    .replace(/\/\/.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  let numQubits = 0;
  let numClbits = 0;
  const ops: GateOp[] = [];

  statements.forEach((statement) => {
    if (/^OPENQASM\s+2\.0$/i.test(statement) || /^include\s+/i.test(statement)) return;

    const qreg = statement.match(/^qreg\s+([a-z]\w*)\[(\d+)\]$/i);
    if (qreg) {
      numQubits = Number(qreg[2]);
      return;
    }

    const creg = statement.match(/^creg\s+([a-z]\w*)\[(\d+)\]$/i);
    if (creg) {
      numClbits = Number(creg[2]);
      return;
    }

    let body = statement;
    let condition: GateOp["condition"];
    const conditional = statement.match(/^if\s*\(\s*([a-z]\w*)\s*==\s*(\d+)\s*\)\s*(.+)$/i);
    if (conditional) {
      condition = { register: conditional[1], value: Number(conditional[2]) };
      body = conditional[3].trim();
    }

    const measurement = body.match(/^measure\s+q\[(\d+)\]\s*->\s*c\[(\d+)\]$/i);
    if (measurement) {
      ops.push({
        id: makeOpId(ops.length),
        name: "measure",
        targets: [Number(measurement[1])],
        clbits: [Number(measurement[2])],
        step: ops.length,
        condition,
      });
      return;
    }

    const gate = body.match(/^([a-z]+)(?:\(([^)]*)\))?\s+(.+)$/i);
    if (!gate) {
      throw new Error(`Unsupported OpenQASM statement: ${statement}`);
    }

    const name = gate[1].toLowerCase() as GateName;
    if (!GATES.has(name)) throw new Error(`Unsupported gate: ${name}`);
    const params = gate[2] ? [parseAngle(gate[2])] : undefined;
    const qubits = parseQubitList(gate[3]);

    if (name === "cx" || name === "cz") {
      ops.push({
        id: makeOpId(ops.length),
        name,
        controls: [qubits[0]],
        targets: [qubits[1]],
        params,
        step: ops.length,
        condition,
      });
      return;
    }

    ops.push({
      id: makeOpId(ops.length),
      name,
      targets: qubits,
      params,
      step: ops.length,
      condition,
    });
  });

  return {
    numQubits: Math.max(1, Math.min(8, numQubits)),
    numClbits: Math.max(1, numClbits),
    ops,
  };
}

function parseQubitList(source: string): number[] {
  return source.split(",").map((part) => {
    const match = part.trim().match(/^q\[(\d+)\]$/i);
    if (!match) throw new Error(`Expected q[index], got ${part}`);
    return Number(match[1]);
  });
}

function parseAngle(source: string): number {
  const expression = source.trim().replace(/\s+/g, "");
  if (expression === "pi") return Math.PI;
  if (expression === "-pi") return -Math.PI;
  const fraction = expression.match(/^(-?)(\d*\.?\d+)?\*?pi(?:\/(\d*\.?\d+))?$/i);
  if (fraction) {
    const sign = fraction[1] === "-" ? -1 : 1;
    const multiplier = fraction[2] ? Number(fraction[2]) : 1;
    const divisor = fraction[3] ? Number(fraction[3]) : 1;
    return sign * multiplier * Math.PI / divisor;
  }
  const division = expression.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (division) return Number(division[1]) / Number(division[2]);
  const numeric = Number(expression);
  if (Number.isFinite(numeric)) return numeric;
  throw new Error(`Unsupported angle expression: ${source}`);
}

function makeOpId(index: number): string {
  return `op-${index}-${Math.random().toString(36).slice(2, 8)}`;
}
