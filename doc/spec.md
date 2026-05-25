# Bloch Stereo Quantum Circuit Editor Specification

Version: 0.4
Last updated: 2026-05-25

---

## Overview

Bloch Stereo is an interactive browser-based quantum circuit visualization environment.

The current implementation combines:

- lightweight quantum circuit editing
- OpenQASM 2.0 import/export
- exact statevector simulation for small circuits
- step-by-step execution
- animated Bloch-sphere visualization
- single-qubit reduced density matrix calculations
- two-qubit correlation matrix visualization
- red-green anaglyph stereoscopic rendering
- an educational quantum teleportation preset
- exhibition-oriented controls with large targets

The system is intended for:

- science museums
- public exhibitions
- educational demonstrations
- quantum information visualization
- interactive learning
- small-scale quantum circuit exploration

Design priorities:

- intuitive understanding
- real-time feedback
- visually smooth transitions
- stereoscopic readability
- browser-based execution
- low cognitive load

---

## Implementation Status

### Implemented In The Initial Version

- Vite + React + TypeScript application shell
- Zustand application state
- SVG circuit timeline display
- gate palette and append-only gate insertion
- gate deletion from the operation strip
- OpenQASM 2.0 text import/export
- exact statevector simulation
- measurement probability calculation, sampling, forced branches, collapse, and classical bit updates
- conditional execution using full classical-register integer values such as `if (c==1)`
- execution snapshots for every step
- previous step, next step, reset, autoplay
- Three.js Bloch sphere renderer
- semi-transparent Bloch sphere globes with latitude/longitude grids
- smoothstep Bloch-vector animation over 400 ms
- mixed-state Bloch-vector length preservation during interpolation
- pointer-driven inertial camera rotation
- wheel zoom
- standard 2D rendering
- red-green/cyan anaglyph rendering via Three.js `AnaglyphEffect`
- stereo mode switching without restart
- single-qubit purity display
- two-qubit correlation matrix for `q0/q1`
- classical bit readout
- teleportation preset
- random measurement mode
- forced measurement branches: `00`, `01`, `10`, `11`
- Vitest coverage for parser and simulator core behavior
- Playwright screenshot/canvas verification script
- English and Japanese README files with language switching

### Not Implemented In The Initial Version

- drag-and-drop gate movement
- inline parameter editing UI
- keyboard shortcuts
- undo/redo
- multiple quantum or classical registers
- arbitrary OpenQASM include semantics
- custom gate definitions
- OpenQASM 3 control flow
- Stream Deck hardware integration
- configurable stereo eye separation UI
- configurable convergence distance UI
- Bloch trajectory history
- animated correlation-matrix interpolation
- explicit entanglement indicator
- full two-qubit density matrix UI
- gate-aware geometric rotation animation for `rx`, `ry`, `rz`
- hardware backend execution
- noise simulation
- GPU acceleration
- tensor-network backend
- WebXR

---

## Core Features

The initial version supports:

1. OpenQASM 2.0 import/export for the supported subset
2. lightweight circuit editing by appending and deleting gates
3. circuit visualization as a horizontal timeline
4. step-by-step execution
5. animated Bloch-vector transitions
6. single-qubit reduced density matrices
7. two-qubit reduced density matrices in the simulator layer
8. 3x3 correlation matrix visualization for `q0/q1`
9. quantum teleportation demonstration
10. red-green/cyan anaglyph stereoscopic rendering
11. trackball-friendly camera rotation and zoom

Stream Deck support remains a future hardware integration goal.

---

## Target Scope

### Included

- OpenQASM 2.0 subset
- pure-state simulation
- measurement
- conditional execution
- reduced density matrices
- Bloch vectors
- correlation matrices
- stereoscopic rendering
- animated visualization
- browser execution
- teleportation demonstration

### Excluded From Initial Version

- OpenQASM 3
- custom gates
- hardware quantum backends
- noise channels
- pulse-level programming
- tensor-network simulation
- distributed or HPC simulation

---

## Target Hardware And Interaction

### Display

Supported display modes:

1. standard 2D monitor
2. red-green or red-cyan anaglyph stereoscopic display

### Pointing Device

Primary pointing device:

- Elecom HUGE PLUS trackball, or similar large trackball

The UI should remain usable with:

- low cursor precision
- low cursor travel
- continuous camera rotation

### Macro Device

Target future macro device:

- Elgato Stream Deck MK.2

The initial version exposes the intended actions as visible UI buttons, but does not yet communicate with Stream Deck hardware.

### Implemented Interaction Model

- left click selects steps and controls
- pointer drag rotates the Bloch camera with damping
- wheel zooms the Bloch camera
- large transport buttons are always visible
- stereo toggle is available without restart
- teleportation preset is one click from the top toolbar

---

## Architecture

```txt
+-----------------------+
| Circuit Editor UI     |
+-----------------------+
            |
            v
+-----------------------+
| Zustand App Store     |
+-----------------------+
            |
            v
+-----------------------+
| Circuit IR            |
+-----------------------+
            |
            +-------------------+
            |                   |
            v                   v
+----------------+    +----------------------+
| OpenQASM I/O   |    | Statevector Engine   |
+----------------+    +----------------------+
                                 |
                                 v
                    +-------------------------+
                    | Density Matrix Engine   |
                    +-------------------------+
                                 |
                                 v
             +--------------------------------------+
             | Bloch Stereo Visualization Engine    |
             +--------------------------------------+
```

### Technology Stack

Frontend:

- TypeScript
- React
- Vite

Rendering:

- Three.js
- WebGL
- Three.js `AnaglyphEffect`

State management:

- Zustand

Testing and verification:

- Vitest
- Playwright
- pngjs for screenshot analysis

---

## File Structure

Current implemented structure:

```txt
src/
  App.tsx
  main.tsx
  math/
    complex.ts
  circuit/
    types.ts
    editor/
      CircuitCanvas.tsx
      CircuitEditor.tsx
      GatePalette.tsx
    qasm2/
      exporter.ts
      parser.ts
      parser.test.ts
    simulator/
      density.ts
      gates.ts
      measurement.ts
      simulator.ts
      simulator.test.ts
  presets/
    teleportation.ts
  stereo/
    BlochSphereStereo.tsx
    CorrelationMatrixStereo.tsx
  store/
    useAppStore.ts
  styles/
    app.css

scripts/
  verify-canvas.mjs
```

---

## Circuit Representation

Implemented TypeScript model:

```ts
type GateName =
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
  | "cx"
  | "cz"
  | "swap"
  | "measure";

type ClassicalCondition = {
  register: string;
  value: number;
};

type GateOp = {
  id: string;
  name: GateName;
  targets: number[];
  controls?: number[];
  params?: number[];
  step: number;
  clbits?: number[];
  condition?: ClassicalCondition;
};

type Circuit = {
  numQubits: number;
  numClbits: number;
  ops: GateOp[];
};
```

Notes:

- `cx` and `cz` use `controls[0]` and `targets[0]`.
- `swap` uses `targets[0]` and `targets[1]`.
- `measure` uses `targets[0]` and `clbits[0]`.
- The current editor appends gates to the end of the operation list.
- The current QASM parser supports one quantum register and one classical register.

---

## Execution Model

Execution is step-based.

Each step:

1. optionally checks a classical condition
2. applies one gate, or skips it if the condition does not match
3. updates the exact statevector
4. updates classical bits for measurement
5. appends measurement records when applicable
6. stores an immutable execution snapshot for visualization

Execution state:

```ts
type MeasurementRecord = {
  qubit: number;
  clbit: number;
  value: 0 | 1;
  probability: number;
};

type ExecutionState = {
  step: number;
  statevector: Complex[];
  classicalBits: number[];
  measurementLog: MeasurementRecord[];
  appliedOp?: GateOp;
};
```

The simulator state remains exact and discrete. The renderer may interpolate visual state between exact snapshots.

---

## OpenQASM 2.0 Support

### Supported Version

- OpenQASM 2.0

### Supported Registers

```qasm
qreg q[3];
creg c[2];
```

The parser accepts custom register names, but only one quantum register and one classical register are supported.

Initial simulator limits:

- `qreg` size must be 1 to 8
- `creg` size must be at least 1
- invalid qubit/classical indexes are rejected

### Supported Single-Qubit Gates

```qasm
id q[0];
x q[0];
y q[0];
z q[0];
h q[0];
s q[0];
sdg q[0];
t q[0];
tdg q[0];
rx(pi/2) q[0];
ry(pi/2) q[0];
rz(pi/2) q[0];
```

The editor palette currently exposes:

- `h`, `x`, `y`, `z`, `s`, `t`
- `rx`, `ry`, `rz`

The parser and simulator also support `id`, `sdg`, and `tdg`.

### Supported Two-Qubit Gates

```qasm
cx q[0], q[1];
cz q[0], q[1];
swap q[0], q[1];
```

Validation rules:

- `cx` and `cz` require distinct control and target qubits
- `swap` requires two distinct target qubits
- two-qubit gates require at least two qubits

### Measurement

```qasm
measure q[0] -> c[0];
```

Measurement:

1. computes probabilities
2. samples or uses a forced branch
3. collapses the exact statevector
4. updates the selected classical bit
5. stores a measurement log entry

### Conditional Execution

Supported form:

```qasm
if (c==1) x q[0];
```

Conditions compare the full little-endian classical register integer:

```txt
value = c0 + 2*c1 + 4*c2 + ...
```

Only equality against the full classical register is implemented.

---

## Circuit Editor

### Implemented

- gate palette
- target qubit selector
- control qubit selector
- measurement branch selector
- append selected gate
- delete existing gate
- select an execution step from the operation strip
- OpenQASM import from textarea
- OpenQASM export to textarea
- circuit timeline SVG
- top-level transport controls

### Not Yet Implemented

- drag-and-drop editing
- moving gates
- inline parameter editing
- keyboard shortcuts
- undo/redo
- multi-register editing

### Circuit Layout

- horizontal axis: timestep
- vertical axis: qubit line

Example:

```txt
q0 --H----*---------M----
          |
q1 -------X--------------
```

---

## Simulation Engine

Method:

```txt
statevector simulation
|psi> in C^(2^n)
```

Initial performance target:

- 1 to 8 qubits
- up to approximately 200 gates
- real-time interaction for exhibition-scale examples

The current simulator prioritizes clarity and correctness over large-scale performance.

---

## Reduced Density Matrices And Bloch Vectors

### Single-Qubit Reduction

For qubit `i`:

```txt
rho_i = Tr_not_i(|psi><psi|)
```

### Bloch Vector

```txt
r_x = Tr(rho X)
r_y = Tr(rho Y)
r_z = Tr(rho Z)
purity = (1 + |r|^2) / 2
```

### Two-Qubit Reduction

For qubits `i` and `j`:

```txt
rho_ij = Tr_not_ij(|psi><psi|)
```

The implementation preserves the requested qubit order in the reduced two-qubit basis.

### Correlation Matrix

```txt
C_ab = Tr(rho_ij sigma_a tensor sigma_b)
```

where:

```txt
a, b in {x, y, z}
```

The UI currently displays the 3x3 correlation matrix for `q0/q1` when the circuit has at least two qubits.

---

## Visualization

### Bloch Sphere View

The renderer displays:

- one Bloch sphere per qubit
- semi-transparent sphere surface
- latitude lines
- longitude lines
- three reference axes
- animated Bloch vector
- purity label

Grid defaults:

```ts
type BlochSphereGridOptions = {
  visible: boolean;
  latitudeCount: number;
  longitudeCount: number;
  opacity: number;
  lineWidth: number;
};
```

Default values:

```txt
visible = true
latitudeCount = 7
longitudeCount = 12
opacity = 0.18
lineWidth = 1
```

### Animation

Bloch vectors move continuously between execution snapshots.

Current transition duration:

```txt
400 ms
```

Interpolation:

```txt
r(t) = (1 - s(t)) r0 + s(t) r1
s(t) = 3t^2 - 2t^3
```

Mixed-state vectors are not normalized during interpolation.

### Camera Interaction

Implemented camera behavior:

- pointer drag changes yaw and pitch velocity
- yaw and pitch use damping
- pitch is clamped for comfort
- wheel changes camera radius
- camera always looks at the scene origin

### Measurement Visualization

Measurement collapse is represented by smooth visual interpolation between exact pre-measurement and post-measurement snapshots.

The exact simulator state is not modified for visual interpolation.

---

## Display Modes

### Standard 2D Mode

2D mode supports:

- vivid gate colors
- colored Bloch vectors
- colorful but restrained correlation matrix cells
- full brightness rendering

### Red-Green/Cyan Stereo Mode

Stereo mode uses Three.js `AnaglyphEffect`.

The UI exposes:

- stereo on/off toggle

Current implementation details:

- no eye-separation UI yet
- no convergence-distance UI yet
- canvas is visually adjusted with reduced saturation and stable contrast

The renderer must remain readable in both 2D and anaglyph mode.

---

## Teleportation Preset

The current preset prepares an input `|+>` state on `q0`, creates a Bell pair on `q1/q2`, performs Bell measurement on `q0/q1`, and conditionally reconstructs the state on `q2`.

Implemented circuit:

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[2];
h q[0];
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
```

Branch interpretation:

```txt
c value = c0 + 2*c1
00 -> no correction
01 -> Z correction
10 -> X correction
11 -> Z then X correction
```

Measurement modes:

- random sampling
- forced branch: `00`, `01`, `10`, `11`

The current visualization shows state evolution, collapse, classical bits, correlations, and reconstructed target-state Bloch vector. It does not yet show explicit classical communication arrows or a dedicated teleportation narrative panel.

---

## Stream Deck Plan

Stream Deck hardware integration is not implemented yet.

Target actions:

- reset
- previous step
- next step
- autoplay/pause
- stereo toggle
- teleportation preset
- gate selection
- gate insertion
- camera reset

Suggested future 15-key layout:

```txt
+-------------------------------+
| Undo | Redo | Reset | Run     |
| Prev | Next | Auto  | Pause   |
| H    | X    | Y     | Z       |
| CX   | M    | QASM  | Stereo  |
+-------------------------------+
```

---

## Testing And Verification

### Unit Tests

Vitest tests currently cover:

- Bell-state reduced Bloch vectors and correlations
- measurement collapse and classical bit updates
- teleportation correction branches
- QASM qreg size validation
- QASM index validation
- QASM conditional register validation

Run:

```sh
npm run test
```

### Build Verification

Run:

```sh
npm run build
```

### Visual Canvas Verification

The Playwright script checks that the WebGL canvas renders nonblank desktop and mobile screenshots.

Run:

```sh
npx playwright install chromium
node scripts/verify-canvas.mjs
```

---

## Performance Targets

The system should maintain:

- 60 FPS in 2D mode
- at least 45 FPS in stereo mode

for:

- 1 to 8 qubits
- up to approximately 200 gates

Performance guidance:

- avoid recreating geometries every animation frame
- keep exact simulation separate from visualization interpolation
- avoid unnecessary React rerenders in the render loop
- keep object allocation out of hot frame paths where practical

---

## Future Extensions

Potential future work:

- drag-and-drop circuit editing
- parameter editor for rotation gates
- keyboard shortcuts
- undo/redo
- OpenQASM 3
- custom gate definitions
- multiple register support
- richer reduced density matrix UI
- entanglement indicators
- trajectory history
- gate-aware Bloch rotations
- Stream Deck SDK integration
- camera reset and camera presets
- configurable stereo parameters
- GPU acceleration
- tensor-network backend
- noise simulation
- WebXR
- quantum error correction visualization

---

## Success Criteria

The project is successful when users can:

1. import or build small quantum circuits interactively
2. step through execution without losing visual continuity
3. understand single-qubit Bloch vectors and mixed-state purity
4. visually grasp basic entanglement through reduced Bloch vectors and correlations
5. follow teleportation step by step
6. use stereoscopic mode comfortably
7. operate the system in a browser with exhibition-friendly controls

The project is not judged primarily by:

- simulator scale
- benchmark performance
- feature count
- production quantum SDK completeness
