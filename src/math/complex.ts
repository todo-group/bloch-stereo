import type { Complex } from "../circuit/types";

export const ZERO: Complex = { re: 0, im: 0 };
export const ONE: Complex = { re: 1, im: 0 };

export function complex(re: number, im = 0): Complex {
  return { re, im };
}

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function sub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function mul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function scale(a: Complex, factor: number): Complex {
  return { re: a.re * factor, im: a.im * factor };
}

export function conj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function abs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function cloneState(state: Complex[]): Complex[] {
  return state.map((amp) => ({ ...amp }));
}

export function formatComplex(value: Complex, precision = 3): string {
  const re = Math.abs(value.re) < 1e-10 ? 0 : value.re;
  const im = Math.abs(value.im) < 1e-10 ? 0 : value.im;
  if (im === 0) return re.toFixed(precision);
  if (re === 0) return `${im.toFixed(precision)}i`;
  const sign = im > 0 ? "+" : "-";
  return `${re.toFixed(precision)} ${sign} ${Math.abs(im).toFixed(precision)}i`;
}
