import { add, complex, conj, mul } from "../../math/complex";
import type { BlochVector, Complex } from "../types";

export type Matrix = Complex[][];

const PAULI_X: Matrix = [
  [complex(0), complex(1)],
  [complex(1), complex(0)],
];
const PAULI_Y: Matrix = [
  [complex(0), complex(0, -1)],
  [complex(0, 1), complex(0)],
];
const PAULI_Z: Matrix = [
  [complex(1), complex(0)],
  [complex(0), complex(-1)],
];
const IDENTITY_2: Matrix = [
  [complex(1), complex(0)],
  [complex(0), complex(1)],
];
const PAULIS = [PAULI_X, PAULI_Y, PAULI_Z];

export function singleQubitDensityMatrix(
  statevector: Complex[],
  numQubits: number,
  qubit: number,
): [[Complex, Complex], [Complex, Complex]] {
  const rho = [
    [complex(0), complex(0)],
    [complex(0), complex(0)],
  ] as [[Complex, Complex], [Complex, Complex]];
  const mask = 1 << qubit;

  for (let basis = 0; basis < 1 << numQubits; basis += 1) {
    if ((basis & mask) !== 0) continue;
    const zeroIndex = basis;
    const oneIndex = basis | mask;
    const a0 = statevector[zeroIndex];
    const a1 = statevector[oneIndex];
    rho[0][0] = add(rho[0][0], mul(a0, conj(a0)));
    rho[0][1] = add(rho[0][1], mul(a0, conj(a1)));
    rho[1][0] = add(rho[1][0], mul(a1, conj(a0)));
    rho[1][1] = add(rho[1][1], mul(a1, conj(a1)));
  }

  return rho;
}

export function blochVectorFromDensity(rho: [[Complex, Complex], [Complex, Complex]]): BlochVector {
  const x = 2 * rho[0][1].re;
  const y = -2 * rho[0][1].im;
  const z = rho[0][0].re - rho[1][1].re;
  const lengthSquared = x * x + y * y + z * z;
  return {
    x: sanitize(x),
    y: sanitize(y),
    z: sanitize(z),
    purity: sanitize((1 + lengthSquared) / 2),
  };
}

export function blochVectorsForState(statevector: Complex[], numQubits: number): BlochVector[] {
  return Array.from({ length: numQubits }, (_, qubit) =>
    blochVectorFromDensity(singleQubitDensityMatrix(statevector, numQubits, qubit)),
  );
}

export function densityMatrixFromStatevector(statevector: Complex[]): Matrix {
  return statevector.map((rowAmp) => statevector.map((colAmp) => mul(rowAmp, conj(colAmp))));
}

export function singleQubitDensityMatrixFromDensity(
  densityMatrix: Matrix,
  numQubits: number,
  qubit: number,
): [[Complex, Complex], [Complex, Complex]] {
  const rho = [
    [complex(0), complex(0)],
    [complex(0), complex(0)],
  ] as [[Complex, Complex], [Complex, Complex]];

  for (let row = 0; row < 1 << numQubits; row += 1) {
    for (let col = 0; col < 1 << numQubits; col += 1) {
      if (!sameEnvironment(row, col, numQubits, qubit)) continue;
      const rowBit = (row >> qubit) & 1;
      const colBit = (col >> qubit) & 1;
      rho[rowBit][colBit] = add(rho[rowBit][colBit], densityMatrix[row][col]);
    }
  }

  return rho;
}

export function blochVectorsForDensityMatrix(densityMatrix: Matrix, numQubits: number): BlochVector[] {
  return Array.from({ length: numQubits }, (_, qubit) =>
    blochVectorFromDensity(singleQubitDensityMatrixFromDensity(densityMatrix, numQubits, qubit)),
  );
}

export function twoQubitDensityMatrix(
  statevector: Complex[],
  numQubits: number,
  first: number,
  second: number,
): Matrix {
  const rho = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => complex(0)));
  for (let row = 0; row < statevector.length; row += 1) {
    for (let col = 0; col < statevector.length; col += 1) {
      if (sameEnvironment(row, col, numQubits, first, second)) {
        const rowPair = pairIndex(row, first, second);
        const colPair = pairIndex(col, first, second);
        rho[rowPair][colPair] = add(rho[rowPair][colPair], mul(statevector[row], conj(statevector[col])));
      }
    }
  }

  return rho;
}

export function correlationMatrix(statevector: Complex[], numQubits: number, first: number, second: number): number[][] {
  const rho = twoQubitDensityMatrix(statevector, numQubits, first, second);
  return correlationMatrixFromTwoQubitDensity(rho);
}

export function twoQubitDensityMatrixFromDensity(
  densityMatrix: Matrix,
  numQubits: number,
  first: number,
  second: number,
): Matrix {
  const rho = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => complex(0)));
  for (let row = 0; row < 1 << numQubits; row += 1) {
    for (let col = 0; col < 1 << numQubits; col += 1) {
      if (sameEnvironment(row, col, numQubits, first, second)) {
        const rowPair = pairIndex(row, first, second);
        const colPair = pairIndex(col, first, second);
        rho[rowPair][colPair] = add(rho[rowPair][colPair], densityMatrix[row][col]);
      }
    }
  }

  return rho;
}

export function correlationMatrixFromDensityMatrix(
  densityMatrix: Matrix,
  numQubits: number,
  first: number,
  second: number,
): number[][] {
  const rho = twoQubitDensityMatrixFromDensity(densityMatrix, numQubits, first, second);
  return correlationMatrixFromTwoQubitDensity(rho);
}

function correlationMatrixFromTwoQubitDensity(rho: Matrix): number[][] {
  return PAULIS.map((pauliA) =>
    PAULIS.map((pauliB) => {
      const joint = expectation(rho, kron2(pauliA, pauliB));
      const first = expectation(rho, kron2(pauliA, IDENTITY_2));
      const second = expectation(rho, kron2(IDENTITY_2, pauliB));
      return sanitize(joint - first * second);
    }),
  );
}

function expectation(rho: Matrix, observable: Matrix): number {
  let trace = complex(0);
  for (let row = 0; row < rho.length; row += 1) {
    for (let col = 0; col < rho.length; col += 1) {
      trace = add(trace, mul(rho[row][col], observable[col][row]));
    }
  }
  return trace.re;
}

function pairIndex(basis: number, first: number, second: number): number {
  const firstBit = (basis >> first) & 1;
  const secondBit = (basis >> second) & 1;
  return (firstBit << 1) + secondBit;
}

function sameEnvironment(row: number, col: number, numQubits: number, qubit: number): boolean;
function sameEnvironment(row: number, col: number, numQubits: number, first: number, second: number): boolean;
function sameEnvironment(row: number, col: number, numQubits: number, first: number, second?: number): boolean {
  for (let qubit = 0; qubit < numQubits; qubit += 1) {
    if (qubit === first || qubit === second) continue;
    if (((row >> qubit) & 1) !== ((col >> qubit) & 1)) return false;
  }
  return true;
}

function kron2(a: Matrix, b: Matrix): Matrix {
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => {
      const aRow = Math.floor(row / 2);
      const aCol = Math.floor(col / 2);
      const bRow = row % 2;
      const bCol = col % 2;
      return mul(a[aRow][aCol], b[bRow][bCol]);
    }),
  );
}

function sanitize(value: number): number {
  return Math.abs(value) < 1e-10 ? 0 : Math.max(-1, Math.min(1, value));
}
