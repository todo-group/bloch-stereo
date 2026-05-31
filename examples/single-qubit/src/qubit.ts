export type C = { re: number; im: number };

export function c(re: number, im = 0): C {
  return { re, im };
}

function add(a: C, b: C): C {
  return { re: a.re + b.re, im: a.im + b.im };
}

function mul(a: C, b: C): C {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function conj(a: C): C {
  return { re: a.re, im: -a.im };
}

function scale(a: C, s: number): C {
  return { re: a.re * s, im: a.im * s };
}

function abs2(a: C): number {
  return a.re * a.re + a.im * a.im;
}

export type Qubit = [C, C]; // alpha|0> + beta|1>

export type Gate = [[C, C], [C, C]];

function normalize(q: Qubit): Qubit {
  const norm = Math.sqrt(abs2(q[0]) + abs2(q[1]));
  if (norm < 1e-12) return [c(1), c(0)];
  return [scale(q[0], 1 / norm), scale(q[1], 1 / norm)];
}

export function applyGate(gate: Gate, q: Qubit): Qubit {
  return normalize([
    add(mul(gate[0][0], q[0]), mul(gate[0][1], q[1])),
    add(mul(gate[1][0], q[0]), mul(gate[1][1], q[1])),
  ]);
}

const S2 = 1 / Math.sqrt(2);
const PI4 = Math.PI / 4;

export const GATES: Record<string, Gate> = {
  H: [
    [c(S2), c(S2)],
    [c(S2), c(-S2)],
  ],
  X: [
    [c(0), c(1)],
    [c(1), c(0)],
  ],
  Y: [
    [c(0), c(0, -1)],
    [c(0, 1), c(0)],
  ],
  Z: [
    [c(1), c(0)],
    [c(0), c(-1)],
  ],
  S: [
    [c(1), c(0)],
    [c(0), c(0, 1)],
  ],
  "S†": [
    [c(1), c(0)],
    [c(0), c(0, -1)],
  ],
  T: [
    [c(1), c(0)],
    [c(0), c(Math.cos(PI4), Math.sin(PI4))],
  ],
  "T†": [
    [c(1), c(0)],
    [c(0), c(Math.cos(PI4), -Math.sin(PI4))],
  ],
};

export type BlochVec = { x: number; y: number; z: number };

export function blochVector(q: Qubit): BlochVec {
  // rho[0][1] = alpha * conj(beta)
  const od = mul(q[0], conj(q[1]));
  return {
    x: 2 * od.re,
    y: -2 * od.im,
    z: abs2(q[0]) - abs2(q[1]),
  };
}

export type MeasureResult = { result: 0 | 1; collapsed: Qubit };

export function measureZ(q: Qubit): MeasureResult {
  const p0 = abs2(q[0]);
  const result: 0 | 1 = Math.random() < p0 ? 0 : 1;
  return { result, collapsed: result === 0 ? [c(1), c(0)] : [c(0), c(1)] };
}

function randn(): number {
  const u = Math.random() + 1e-15;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

export function haarRandom(): Qubit {
  return normalize([
    { re: randn(), im: randn() },
    { re: randn(), im: randn() },
  ]);
}

export function fmtC(v: C): string {
  const re = v.re.toFixed(3);
  const im = v.im >= 0 ? `+${v.im.toFixed(3)}i` : `${v.im.toFixed(3)}i`;
  return `${re}${im}`;
}

export function prob0(q: Qubit): number {
  return abs2(q[0]);
}

export function prob1(q: Qubit): number {
  return abs2(q[1]);
}

export const ZERO: Qubit = [c(1), c(0)];
export const ONE: Qubit = [c(0), c(1)];
export const PLUS: Qubit = [c(S2), c(S2)];
export const MINUS: Qubit = [c(S2), c(-S2)];
export const PLUS_I: Qubit = [c(S2), c(0, S2)];
export const MINUS_I: Qubit = [c(S2), c(0, -S2)];
