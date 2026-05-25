import { complex } from "../../math/complex";
import type { Complex, GateName } from "../types";

export type Matrix2 = [[Complex, Complex], [Complex, Complex]];

const INV_SQRT2 = 1 / Math.sqrt(2);

export function singleQubitMatrix(name: GateName, params: number[] = []): Matrix2 {
  switch (name) {
    case "id":
      return [
        [complex(1), complex(0)],
        [complex(0), complex(1)],
      ];
    case "x":
      return [
        [complex(0), complex(1)],
        [complex(1), complex(0)],
      ];
    case "y":
      return [
        [complex(0), complex(0, -1)],
        [complex(0, 1), complex(0)],
      ];
    case "z":
      return [
        [complex(1), complex(0)],
        [complex(0), complex(-1)],
      ];
    case "h":
      return [
        [complex(INV_SQRT2), complex(INV_SQRT2)],
        [complex(INV_SQRT2), complex(-INV_SQRT2)],
      ];
    case "s":
      return [
        [complex(1), complex(0)],
        [complex(0), complex(0, 1)],
      ];
    case "sdg":
      return [
        [complex(1), complex(0)],
        [complex(0), complex(0, -1)],
      ];
    case "t":
      return [
        [complex(1), complex(0)],
        [complex(0), complex(Math.SQRT1_2, Math.SQRT1_2)],
      ];
    case "tdg":
      return [
        [complex(1), complex(0)],
        [complex(0), complex(Math.SQRT1_2, -Math.SQRT1_2)],
      ];
    case "rx": {
      const theta = params[0] ?? 0;
      return [
        [complex(Math.cos(theta / 2)), complex(0, -Math.sin(theta / 2))],
        [complex(0, -Math.sin(theta / 2)), complex(Math.cos(theta / 2))],
      ];
    }
    case "ry": {
      const theta = params[0] ?? 0;
      return [
        [complex(Math.cos(theta / 2)), complex(-Math.sin(theta / 2))],
        [complex(Math.sin(theta / 2)), complex(Math.cos(theta / 2))],
      ];
    }
    case "rz": {
      const theta = params[0] ?? 0;
      return [
        [complex(Math.cos(theta / 2), -Math.sin(theta / 2)), complex(0)],
        [complex(0), complex(Math.cos(theta / 2), Math.sin(theta / 2))],
      ];
    }
    default:
      throw new Error(`Gate ${name} is not a single-qubit gate`);
  }
}

export function isSingleQubitGate(name: GateName): boolean {
  return ["id", "x", "y", "z", "h", "s", "sdg", "t", "tdg", "rx", "ry", "rz"].includes(name);
}
