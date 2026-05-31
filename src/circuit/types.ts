export type GateName =
  | "id"
  | "x"
  | "y"
  | "z"
  | "h"
  | "s"
  | "sdg"
  | "t"
  | "tdg"
  | "rx"
  | "ry"
  | "rz"
  | "depolarize"
  | "dephase"
  | "ampdamp"
  | "cx"
  | "cz"
  | "swap"
  | "measure";

export type ClassicalCondition = {
  register: string;
  value: number;
};

export type GateOp = {
  id: string;
  name: GateName;
  targets: number[];
  controls?: number[];
  params?: number[];
  step: number;
  clbits?: number[];
  condition?: ClassicalCondition;
};

export type Circuit = {
  numQubits: number;
  numClbits: number;
  ops: GateOp[];
};

export type Complex = {
  re: number;
  im: number;
};

export type MeasurementRecord = {
  qubit: number;
  clbit: number;
  value: 0 | 1;
  probability: number;
};

export type ExecutionState = {
  step: number;
  statevector: Complex[];
  densityMatrix?: Complex[][];
  classicalBits: number[];
  measurementLog: MeasurementRecord[];
  appliedOp?: GateOp;
};

export type SimulationBackend = "statevector" | "density-matrix";

export type BlochVector = {
  x: number;
  y: number;
  z: number;
  purity: number;
};

export type DisplayMode = "2d" | "anaglyph-red-green";

export type StereoSettings = {
  enabled: boolean;
  eyeSeparation: number;
  convergenceDistance: number;
  redGain: number;
  cyanGain: number;
  preserveBrightness: boolean;
};

export type BlochSphereGridOptions = {
  visible: boolean;
  latitudeCount: number;
  longitudeCount: number;
  opacity: number;
  lineWidth: number;
};

export const DEFAULT_GRID_OPTIONS: BlochSphereGridOptions = {
  visible: true,
  latitudeCount: 7,
  longitudeCount: 12,
  opacity: 0.18,
  lineWidth: 1,
};
