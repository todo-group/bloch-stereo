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

  let qregName = "q";
  let cregName = "c";
  let numQubits = 0;
  let numClbits = 0;
  const ops: GateOp[] = [];

  statements.forEach((statement) => {
    if (/^OPENQASM\s+2\.0$/i.test(statement) || /^include\s+/i.test(statement)) return;

    const qreg = statement.match(/^qreg\s+([a-z]\w*)\[(\d+)\]$/i);
    if (qreg) {
      qregName = qreg[1];
      numQubits = Number(qreg[2]);
      if (numQubits < 1 || numQubits > 8) {
        throw new Error(`qreg size must be 1..8 for the initial simulator; got ${numQubits}.`);
      }
      return;
    }

    const creg = statement.match(/^creg\s+([a-z]\w*)\[(\d+)\]$/i);
    if (creg) {
      cregName = creg[1];
      numClbits = Number(creg[2]);
      if (numClbits < 1) {
        throw new Error(`creg size must be at least 1; got ${numClbits}.`);
      }
      return;
    }

    let body = statement;
    let condition: GateOp["condition"];
    const conditional = statement.match(/^if\s*\(\s*([a-z]\w*)\s*==\s*(\d+)\s*\)\s*(.+)$/i);
    if (conditional) {
      condition = { register: conditional[1], value: Number(conditional[2]) };
      body = conditional[3].trim();
    }

    const measurement = body.match(/^measure\s+([a-z]\w*)\[(\d+)\]\s*->\s*([a-z]\w*)\[(\d+)\]$/i);
    if (measurement) {
      assertRegisterName(measurement[1], qregName, "quantum");
      assertRegisterName(measurement[3], cregName, "classical");
      ops.push({
        id: makeOpId(ops.length),
        name: "measure",
        targets: [Number(measurement[2])],
        clbits: [Number(measurement[4])],
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
    const qubits = parseQubitList(gate[3], qregName);

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

  const circuit = {
    numQubits: numQubits || 1,
    numClbits: numClbits || 1,
    ops,
  };
  validateCircuit(circuit, cregName);
  return circuit;
}

function parseQubitList(source: string, qregName: string): number[] {
  return source.split(",").map((part) => {
    const match = part.trim().match(/^([a-z]\w*)\[(\d+)\]$/i);
    if (!match) throw new Error(`Expected q[index], got ${part}`);
    assertRegisterName(match[1], qregName, "quantum");
    return Number(match[2]);
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

function assertRegisterName(actual: string, expected: string, kind: string): void {
  if (actual !== expected) {
    throw new Error(`Unsupported ${kind} register "${actual}". Expected "${expected}".`);
  }
}

function validateCircuit(circuit: Circuit, cregName: string): void {
  circuit.ops.forEach((op) => {
    op.targets.forEach((target) => assertIndex(target, circuit.numQubits, "qubit"));
    op.controls?.forEach((control) => assertIndex(control, circuit.numQubits, "qubit"));
    op.clbits?.forEach((clbit) => assertIndex(clbit, circuit.numClbits, "classical bit"));
    if (op.condition && op.condition.register !== cregName) {
      throw new Error(`Unsupported conditional register "${op.condition.register}". Expected "${cregName}".`);
    }
    if ((op.name === "cx" || op.name === "cz" || op.name === "swap") && circuit.numQubits < 2) {
      throw new Error(`${op.name.toUpperCase()} requires at least 2 qubits.`);
    }
  });
}

function assertIndex(index: number, size: number, label: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= size) {
    throw new Error(`Invalid ${label} index ${index}; valid range is 0..${size - 1}.`);
  }
}
