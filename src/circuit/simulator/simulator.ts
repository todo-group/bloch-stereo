import { add, cloneState, complex, mul } from "../../math/complex";
import type { Circuit, Complex, ExecutionState, GateOp } from "../types";
import { isSingleQubitGate, singleQubitMatrix, type Matrix2 } from "./gates";
import { measureQubit } from "./measurement";

export type ExecutionOptions = {
  forcedMeasurements?: Array<0 | 1>;
  random?: () => number;
};

export function initialStatevector(numQubits: number): Complex[] {
  const statevector = Array.from({ length: 1 << numQubits }, () => complex(0));
  statevector[0] = complex(1);
  return statevector;
}

export function executeCircuit(circuit: Circuit, options: ExecutionOptions = {}): ExecutionState[] {
  validateCircuitForExecution(circuit);
  let statevector = initialStatevector(circuit.numQubits);
  let classicalBits = Array.from({ length: circuit.numClbits }, () => 0);
  let measurementIndex = 0;
  const measurementLog: ExecutionState["measurementLog"] = [];
  const snapshots: ExecutionState[] = [
    {
      step: 0,
      statevector: cloneState(statevector),
      classicalBits: [...classicalBits],
      measurementLog: [],
    },
  ];

  circuit.ops.forEach((op, opIndex) => {
    if (!shouldApplyCondition(op, classicalBits)) {
      snapshots.push({
        step: opIndex + 1,
        statevector: cloneState(statevector),
        classicalBits: [...classicalBits],
        measurementLog: [...measurementLog],
        appliedOp: op,
      });
      return;
    }

    if (isSingleQubitGate(op.name)) {
      statevector = applySingleQubitGate(
        statevector,
        circuit.numQubits,
        op.targets[0],
        singleQubitMatrix(op.name, op.params),
      );
    } else if (op.name === "cx") {
      statevector = applyControlledX(statevector, requiredControl(op), op.targets[0]);
    } else if (op.name === "cz") {
      statevector = applyControlledZ(statevector, requiredControl(op), op.targets[0]);
    } else if (op.name === "swap") {
      statevector = applySwap(statevector, op.targets[0], op.targets[1]);
    } else if (op.name === "measure") {
      const forced = options.forcedMeasurements?.[measurementIndex];
      const measured = measureQubit(statevector, op.targets[0], forced, options.random);
      measurementIndex += 1;
      statevector = measured.statevector;
      const clbit = op.clbits?.[0] ?? 0;
      classicalBits = classicalBits.map((bit, index) => (index === clbit ? measured.value : bit));
      measurementLog.push({
        qubit: op.targets[0],
        clbit,
        value: measured.value,
        probability: measured.probability,
      });
    }

    snapshots.push({
      step: opIndex + 1,
      statevector: cloneState(statevector),
      classicalBits: [...classicalBits],
      measurementLog: [...measurementLog],
      appliedOp: op,
    });
  });

  return snapshots;
}

function validateCircuitForExecution(circuit: Circuit): void {
  if (!Number.isInteger(circuit.numQubits) || circuit.numQubits < 1 || circuit.numQubits > 8) {
    throw new Error(`Circuit must contain 1 to 8 qubits; got ${circuit.numQubits}.`);
  }
  if (!Number.isInteger(circuit.numClbits) || circuit.numClbits < 1) {
    throw new Error(`Circuit must contain at least 1 classical bit; got ${circuit.numClbits}.`);
  }
  circuit.ops.forEach((op) => {
    op.targets.forEach((target) => assertIndex(target, circuit.numQubits, "qubit"));
    op.controls?.forEach((control) => assertIndex(control, circuit.numQubits, "qubit"));
    op.clbits?.forEach((clbit) => assertIndex(clbit, circuit.numClbits, "classical bit"));
    if ((op.name === "cx" || op.name === "cz") && requiredControl(op) === op.targets[0]) {
      throw new Error(`${op.name.toUpperCase()} control and target must be different.`);
    }
    if (op.name === "swap" && op.targets[0] === op.targets[1]) {
      throw new Error("SWAP targets must be different.");
    }
  });
}

function requiredControl(op: GateOp): number {
  const control = op.controls?.[0];
  if (control === undefined) throw new Error(`${op.name.toUpperCase()} requires a control qubit.`);
  return control;
}

function assertIndex(index: number, size: number, label: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= size) {
    throw new Error(`Invalid ${label} index ${index}; valid range is 0..${size - 1}.`);
  }
}

function shouldApplyCondition(op: GateOp, classicalBits: number[]): boolean {
  if (!op.condition) return true;
  const registerValue = classicalBits.reduce((value, bit, index) => value + (bit << index), 0);
  return registerValue === op.condition.value;
}

function applySingleQubitGate(
  statevector: Complex[],
  numQubits: number,
  target: number,
  matrix: Matrix2,
): Complex[] {
  const next = cloneState(statevector);
  const targetMask = 1 << target;
  const span = 1 << numQubits;

  for (let basis = 0; basis < span; basis += 1) {
    if ((basis & targetMask) !== 0) continue;
    const zeroIndex = basis;
    const oneIndex = basis | targetMask;
    const zeroAmp = statevector[zeroIndex];
    const oneAmp = statevector[oneIndex];
    next[zeroIndex] = add(mul(matrix[0][0], zeroAmp), mul(matrix[0][1], oneAmp));
    next[oneIndex] = add(mul(matrix[1][0], zeroAmp), mul(matrix[1][1], oneAmp));
  }

  return next;
}

function applyControlledX(statevector: Complex[], control: number, target: number): Complex[] {
  const next = cloneState(statevector);
  const controlMask = 1 << control;
  const targetMask = 1 << target;

  for (let basis = 0; basis < statevector.length; basis += 1) {
    if ((basis & controlMask) === 0 || (basis & targetMask) !== 0) continue;
    const flipped = basis | targetMask;
    next[basis] = statevector[flipped];
    next[flipped] = statevector[basis];
  }

  return next;
}

function applyControlledZ(statevector: Complex[], control: number, target: number): Complex[] {
  const controlMask = 1 << control;
  const targetMask = 1 << target;
  return statevector.map((amp, basis) =>
    (basis & controlMask) !== 0 && (basis & targetMask) !== 0 ? { re: -amp.re, im: -amp.im } : { ...amp },
  );
}

function applySwap(statevector: Complex[], first: number, second: number): Complex[] {
  if (first === second) return cloneState(statevector);
  const next = cloneState(statevector);
  const firstMask = 1 << first;
  const secondMask = 1 << second;

  for (let basis = 0; basis < statevector.length; basis += 1) {
    const firstBit = (basis & firstMask) !== 0;
    const secondBit = (basis & secondMask) !== 0;
    if (firstBit === secondBit || !firstBit) continue;
    const swapped = basis ^ firstMask ^ secondMask;
    next[basis] = statevector[swapped];
    next[swapped] = statevector[basis];
  }

  return next;
}
