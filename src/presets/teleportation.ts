export const zeroQasm = createZeroStateQasm(1);
export const zeroZeroQasm = createZeroStateQasm(2);
export const zeroZeroZeroQasm = createZeroStateQasm(3);

export const bellQasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
`;

export const mixedProductQasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
depolarize(1) q[0];
depolarize(1) q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
`;

export const ghzQasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
h q[0];
cx q[0], q[1];
cx q[0], q[2];
measure q[0] -> c[0];
measure q[1] -> c[1];
measure q[2] -> c[2];
`;

export const hCzMeasureQasm = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
h q[0];
cx q[0], q[1];
h q[2];
cz q[1], q[2];
h q[2];
measure q[0] -> c[0];
measure q[1] -> c[1];
measure q[2] -> c[2];
`;

export type QubitAngles = {
  theta: number;
  phi: number;
};

export function randomQubitAngles(): QubitAngles {
  const theta = Math.acos(1 - 2 * Math.random());
  const phi = Math.random() * Math.PI * 2;
  return { theta, phi };
}

export function createRandomSwapQasm(
  first: QubitAngles = randomQubitAngles(),
  second: QubitAngles = randomQubitAngles(),
): string {
  return `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
ry(${formatAngle(first.theta)}) q[0];
rz(${formatAngle(first.phi)}) q[0];
ry(${formatAngle(second.theta)}) q[1];
rz(${formatAngle(second.phi)}) q[1];
cx q[0], q[1];
cx q[1], q[0];
cx q[0], q[1];
`;
}

export function createTeleportationQasm({ theta, phi }: QubitAngles = randomQubitAngles()): string {
  return `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[2];
ry(${formatAngle(theta)}) q[0];
rz(${formatAngle(phi)}) q[0];
h q[1];
cx q[1], q[2];
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];
if (c==1) z q[2];
if (c==2) x q[2];
if (c==3) z q[2];
if (c==3) x q[2];
`;
}

export const teleportationQasm = createTeleportationQasm({ theta: Math.PI / 2, phi: 0 });

function createZeroStateQasm(qubits: number): string {
  return `OPENQASM 2.0;
include "qelib1.inc";
qreg q[${qubits}];
creg c[${qubits}];
`;
}

function formatAngle(value: number): string {
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
