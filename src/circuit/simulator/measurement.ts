import { abs2, cloneState, scale } from "../../math/complex";
import type { Complex } from "../types";

export type MeasurementResult = {
  value: 0 | 1;
  probability: number;
  statevector: Complex[];
};

export function probabilityOfOne(statevector: Complex[], qubit: number): number {
  const mask = 1 << qubit;
  return statevector.reduce((sum, amp, basis) => (basis & mask ? sum + abs2(amp) : sum), 0);
}

export function measureQubit(
  statevector: Complex[],
  qubit: number,
  forcedValue?: 0 | 1,
  random = Math.random,
): MeasurementResult {
  const probabilityOne = probabilityOfOne(statevector, qubit);
  const value: 0 | 1 = forcedValue ?? (random() < probabilityOne ? 1 : 0);
  const probability = value === 1 ? probabilityOne : 1 - probabilityOne;
  const norm = probability > 1e-12 ? 1 / Math.sqrt(probability) : 0;
  const mask = 1 << qubit;
  const collapsed = cloneState(statevector).map((amp, basis) => {
    const bit = (basis & mask) === 0 ? 0 : 1;
    return bit === value ? scale(amp, norm) : { re: 0, im: 0 };
  });

  return { value, probability, statevector: collapsed };
}
