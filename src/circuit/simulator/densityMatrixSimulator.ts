import { add, cloneState, complex, conj, mul, scale } from "../../math/complex";
import type { Circuit, Complex, ExecutionState, GateOp } from "../types";
import { densityMatrixFromStatevector, type Matrix } from "./density";
import type { ExecutionOptions } from "./simulator";
import { isSingleQubitGate, singleQubitMatrix, type Matrix2 } from "./gates";

export function executeDensityMatrixCircuit(circuit: Circuit, options: ExecutionOptions = {}): ExecutionState[] {
  let densityMatrix = densityMatrixFromStatevector(initialStatevector(circuit.numQubits));
  const fallbackStatevector = initialStatevector(circuit.numQubits);
  let classicalBits = Array.from({ length: circuit.numClbits }, () => 0);
  let measurementIndex = 0;
  const measurementLog: ExecutionState["measurementLog"] = [];
  const snapshots: ExecutionState[] = [
    {
      step: 0,
      statevector: cloneState(fallbackStatevector),
      densityMatrix: cloneDensityMatrix(densityMatrix),
      classicalBits: [...classicalBits],
      measurementLog: [],
    },
  ];

  circuit.ops.forEach((op, opIndex) => {
    if (!shouldApplyCondition(op, classicalBits)) {
      snapshots.push(makeSnapshot(opIndex, fallbackStatevector, densityMatrix, classicalBits, measurementLog, op));
      return;
    }

    if (isSingleQubitGate(op.name)) {
      densityMatrix = applySingleQubitDensityGate(
        densityMatrix,
        circuit.numQubits,
        op.targets[0],
        singleQubitMatrix(op.name, op.params),
      );
    } else if (op.name === "cx") {
      densityMatrix = applyControlledXDensity(densityMatrix, requiredControl(op), op.targets[0]);
    } else if (op.name === "cz") {
      densityMatrix = applyControlledZDensity(densityMatrix, requiredControl(op), op.targets[0]);
    } else if (op.name === "swap") {
      densityMatrix = applySwapViaControlledXDensity(densityMatrix, op.targets[0], op.targets[1]);
    } else if (isNoiseGate(op)) {
      densityMatrix = applyNoiseChannel(densityMatrix, circuit.numQubits, op.targets[0], op.name, op.params?.[0] ?? 0);
    } else if (op.name === "measure") {
      const forced = options.forcedMeasurements?.[measurementIndex];
      const measured = measureDensityMatrix(densityMatrix, op.targets[0], forced, options.random);
      measurementIndex += 1;
      densityMatrix = measured.densityMatrix;
      const clbit = op.clbits?.[0] ?? 0;
      classicalBits = classicalBits.map((bit, index) => (index === clbit ? measured.value : bit));
      measurementLog.push({
        qubit: op.targets[0],
        clbit,
        value: measured.value,
        probability: measured.probability,
      });
    }

    snapshots.push(makeSnapshot(opIndex, fallbackStatevector, densityMatrix, classicalBits, measurementLog, op));
  });

  return snapshots;
}

function applyNoiseChannel(
  densityMatrix: Matrix,
  numQubits: number,
  target: number,
  name: "depolarize" | "dephase" | "ampdamp",
  probability: number,
): Matrix {
  const krausOperators = noiseKrausOperators(name, clamp(probability, 0, 1));
  return krausOperators
    .map((operator) => applySingleQubitDensityGate(densityMatrix, numQubits, target, operator))
    .reduce(sumMatrices);
}

function noiseKrausOperators(name: "depolarize" | "dephase" | "ampdamp", probability: number): Matrix2[] {
  if (name === "depolarize") {
    return [
      scaleMatrix(identity(), Math.sqrt(1 - (3 * probability) / 4)),
      scaleMatrix(pauliX(), Math.sqrt(probability / 4)),
      scaleMatrix(pauliY(), Math.sqrt(probability / 4)),
      scaleMatrix(pauliZ(), Math.sqrt(probability / 4)),
    ];
  }
  if (name === "dephase") {
    return [
      scaleMatrix(identity(), Math.sqrt(1 - probability)),
      scaleMatrix(projectorZero(), Math.sqrt(probability)),
      scaleMatrix(projectorOne(), Math.sqrt(probability)),
    ];
  }
  return [
    [
      [complex(1), complex(0)],
      [complex(0), complex(Math.sqrt(1 - probability))],
    ],
    [
      [complex(0), complex(Math.sqrt(probability))],
      [complex(0), complex(0)],
    ],
  ];
}

function makeSnapshot(
  opIndex: number,
  fallbackStatevector: Complex[],
  densityMatrix: Matrix,
  classicalBits: number[],
  measurementLog: ExecutionState["measurementLog"],
  op: GateOp,
): ExecutionState {
  return {
    step: opIndex + 1,
    statevector: statevectorFromPureDensity(densityMatrix) ?? cloneState(fallbackStatevector),
    densityMatrix: cloneDensityMatrix(densityMatrix),
    classicalBits: [...classicalBits],
    measurementLog: [...measurementLog],
    appliedOp: op,
  };
}

function applySingleQubitDensityGate(
  densityMatrix: Matrix,
  numQubits: number,
  target: number,
  matrix: Matrix2,
): Matrix {
  const size = 1 << numQubits;
  const mask = 1 << target;
  const temp = zeroMatrix(size);
  const next = zeroMatrix(size);

  for (let row = 0; row < size; row += 1) {
    if ((row & mask) !== 0) continue;
    const row0 = row;
    const row1 = row | mask;
    for (let col = 0; col < size; col += 1) {
      temp[row0][col] = add(mul(matrix[0][0], densityMatrix[row0][col]), mul(matrix[0][1], densityMatrix[row1][col]));
      temp[row1][col] = add(mul(matrix[1][0], densityMatrix[row0][col]), mul(matrix[1][1], densityMatrix[row1][col]));
    }
  }

  for (let col = 0; col < size; col += 1) {
    if ((col & mask) !== 0) continue;
    const col0 = col;
    const col1 = col | mask;
    for (let row = 0; row < size; row += 1) {
      next[row][col0] = add(mul(temp[row][col0], conj(matrix[0][0])), mul(temp[row][col1], conj(matrix[0][1])));
      next[row][col1] = add(mul(temp[row][col0], conj(matrix[1][0])), mul(temp[row][col1], conj(matrix[1][1])));
    }
  }

  return next;
}

function applyControlledXDensity(densityMatrix: Matrix, control: number, target: number): Matrix {
  return applyBasisPermutation(densityMatrix, (basis) => {
    const controlMask = 1 << control;
    const targetMask = 1 << target;
    return (basis & controlMask) !== 0 ? basis ^ targetMask : basis;
  });
}

function applyControlledZDensity(densityMatrix: Matrix, control: number, target: number): Matrix {
  const controlMask = 1 << control;
  const targetMask = 1 << target;
  return densityMatrix.map((row, rowBasis) =>
    row.map((value, colBasis) => {
      const rowPhase = (rowBasis & controlMask) !== 0 && (rowBasis & targetMask) !== 0 ? -1 : 1;
      const colPhase = (colBasis & controlMask) !== 0 && (colBasis & targetMask) !== 0 ? -1 : 1;
      return scale(value, rowPhase * colPhase);
    }),
  );
}

function applySwapViaControlledXDensity(densityMatrix: Matrix, first: number, second: number): Matrix {
  if (first === second) return cloneDensityMatrix(densityMatrix);
  return applyControlledXDensity(
    applyControlledXDensity(applyControlledXDensity(densityMatrix, first, second), second, first),
    first,
    second,
  );
}

function applyBasisPermutation(densityMatrix: Matrix, permute: (basis: number) => number): Matrix {
  const size = densityMatrix.length;
  const next = zeroMatrix(size);
  for (let row = 0; row < size; row += 1) {
    const nextRow = permute(row);
    for (let col = 0; col < size; col += 1) {
      next[nextRow][permute(col)] = densityMatrix[row][col];
    }
  }
  return next;
}

function isNoiseGate(op: GateOp): op is GateOp & { name: "depolarize" | "dephase" | "ampdamp" } {
  return op.name === "depolarize" || op.name === "dephase" || op.name === "ampdamp";
}

function measureDensityMatrix(
  densityMatrix: Matrix,
  qubit: number,
  forcedValue?: 0 | 1,
  random = Math.random,
): { value: 0 | 1; probability: number; densityMatrix: Matrix } {
  const mask = 1 << qubit;
  const probabilityOne = densityMatrix.reduce((sum, row, basis) => ((basis & mask) !== 0 ? sum + row[basis].re : sum), 0);
  const value: 0 | 1 = forcedValue ?? (random() < probabilityOne ? 1 : 0);
  const probability = value === 1 ? probabilityOne : 1 - probabilityOne;
  const norm = probability > 1e-12 ? 1 / probability : 0;
  const collapsed = densityMatrix.map((row, rowBasis) =>
    row.map((entry, colBasis) => {
      const rowBit = (rowBasis & mask) === 0 ? 0 : 1;
      const colBit = (colBasis & mask) === 0 ? 0 : 1;
      return rowBit === value && colBit === value ? scale(entry, norm) : complex(0);
    }),
  );
  return { value, probability, densityMatrix: collapsed };
}

function shouldApplyCondition(op: GateOp, classicalBits: number[]): boolean {
  if (!op.condition) return true;
  const registerValue = classicalBits.reduce((value, bit, index) => value + (bit << index), 0);
  return registerValue === op.condition.value;
}

function requiredControl(op: GateOp): number {
  const control = op.controls?.[0];
  if (control === undefined) throw new Error(`${op.name.toUpperCase()} requires a control qubit.`);
  return control;
}

function cloneDensityMatrix(densityMatrix: Matrix): Matrix {
  return densityMatrix.map((row) => row.map((entry) => ({ ...entry })));
}

function zeroMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => complex(0)));
}

function sumMatrices(left: Matrix, right: Matrix): Matrix {
  return left.map((row, rowIndex) => row.map((value, colIndex) => add(value, right[rowIndex][colIndex])));
}

function scaleMatrix(matrix: Matrix2, factor: number): Matrix2 {
  return [
    [scale(matrix[0][0], factor), scale(matrix[0][1], factor)],
    [scale(matrix[1][0], factor), scale(matrix[1][1], factor)],
  ];
}

function identity(): Matrix2 {
  return [
    [complex(1), complex(0)],
    [complex(0), complex(1)],
  ];
}

function pauliX(): Matrix2 {
  return [
    [complex(0), complex(1)],
    [complex(1), complex(0)],
  ];
}

function pauliY(): Matrix2 {
  return [
    [complex(0), complex(0, -1)],
    [complex(0, 1), complex(0)],
  ];
}

function pauliZ(): Matrix2 {
  return [
    [complex(1), complex(0)],
    [complex(0), complex(-1)],
  ];
}

function projectorZero(): Matrix2 {
  return [
    [complex(1), complex(0)],
    [complex(0), complex(0)],
  ];
}

function projectorOne(): Matrix2 {
  return [
    [complex(0), complex(0)],
    [complex(0), complex(1)],
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function initialStatevector(numQubits: number): Complex[] {
  const statevector = Array.from({ length: 1 << numQubits }, () => complex(0));
  statevector[0] = complex(1);
  return statevector;
}

function statevectorFromPureDensity(densityMatrix: Matrix): Complex[] | undefined {
  let pivot = 0;
  let probability = densityMatrix[0]?.[0]?.re ?? 0;
  for (let index = 1; index < densityMatrix.length; index += 1) {
    const candidate = densityMatrix[index][index].re;
    if (candidate > probability) {
      pivot = index;
      probability = candidate;
    }
  }
  if (probability < 1e-12) return undefined;
  const scaleFactor = 1 / Math.sqrt(probability);
  return densityMatrix.map((row) => scale(row[pivot], scaleFactor));
}
