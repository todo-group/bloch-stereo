# Bloch Stereo Quantum Circuit Editor Specification

Version: 0.5
Last updated: 2026-05-31

---

## Overview

Bloch Stereo is an interactive browser-based quantum circuit visualization environment.

The current implementation combines:

- lightweight quantum circuit editing
- OpenQASM 2.0 import/export
- exact statevector and density-matrix simulation for small circuits
- step-by-step execution
- animated Bloch-sphere visualization
- single-qubit reduced density matrix calculations
- two-qubit connected correlation matrix visualization
- red-green anaglyph stereoscopic rendering
- adjustable anaglyph stereo controls
- educational Bell, GHZ, and quantum teleportation presets
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
- left circuit editor panel hide/show toggle
- exact statevector simulation
- density-matrix simulation backend selectable in the simulator API
- density-matrix noise channels: `depolarize(p)`, `dephase(p)`, and `ampdamp(p)`
- measurement probability calculation, random sampling, collapse, and classical bit updates
- conditional execution using full classical-register integer values such as `if (c==1)`
- execution snapshots for every step
- previous step, next step, reset, autoplay
- Stream Deck-friendly keyboard shortcuts for previous, next, reset, editor hide/show, gate insertion, and held camera control
- Three.js Bloch sphere renderer
- semi-transparent Bloch sphere globes with latitude/longitude grids
- smoothstep Bloch-vector animation over 400 ms
- mixed-state Bloch-vector length preservation during interpolation
- pointer-driven inertial camera rotation
- wheel zoom
- standard 2D rendering
- red-green/cyan anaglyph rendering via Three.js `AnaglyphEffect`
- stereo mode switching without restart
- adjustable eye separation, stereo focus, and red/cyan channel strength
- Bloch-axis labels for `|0>`, `|1>`, `|+>`, `|->`, `|i>`, and `|-i>`
- depth cues: floor grid, bounding cube, depth rings, and front/back markers
- single-qubit purity display
- selectable two-qubit connected correlation matrix
- classical bit readout
- initial-state, Bell, mixed-product, GHZ, H-CZ measurement, random-swap, and teleportation presets
- random measurement sampling for the measurement being entered, while preserving earlier measurement outcomes
- Vitest coverage for parser and simulator core behavior
- Playwright screenshot/canvas verification script
- English and Japanese README files with language switching

### Not Implemented In The Initial Version

- drag-and-drop gate movement
- inline parameter editing UI
- additional keyboard shortcuts beyond the Stream Deck-friendly core set
- undo/redo
- multiple quantum or classical registers
- arbitrary OpenQASM include semantics
- custom gate definitions
- OpenQASM 3 control flow
- Stream Deck hardware integration
- Bloch trajectory history
- animated correlation-matrix interpolation
- explicit entanglement indicator
- full two-qubit density matrix UI
- gate-aware geometric rotation animation for `rx`, `ry`, `rz`
- hardware backend execution
- non-unitary channel support in the statevector backend
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
8. selectable 3x3 connected correlation matrix visualization
9. quantum teleportation demonstration
10. red-green/cyan anaglyph stereoscopic rendering
11. trackball-friendly camera rotation and zoom

Direct Stream Deck SDK support remains a future hardware integration goal.

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
- additional noise models beyond depolarizing, dephasing, and amplitude damping
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

The current version supports Stream Deck use through ordinary keyboard actions. It does not yet communicate with Stream Deck hardware through the SDK.

### Implemented Interaction Model

- left click selects steps and controls
- left and right arrow keys move to the previous and next execution step
- `R` or `Home` resets execution
- `+` or numpad `+` appends the selected gate
- `E` toggles the left circuit editor panel
- holding `C` while moving the mouse rotates the Bloch camera
- holding `Z` while moving the mouse vertically zooms the Bloch camera
- pointer drag rotates the Bloch camera with damping
- wheel zooms the Bloch camera
- large transport buttons are always visible
- stereo toggle is available without restart
- Bell, GHZ, and quantum teleportation presets are selectable from the top toolbar preset pull-down

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
- local adjustable anaglyph effect based on Three.js `AnaglyphEffect`

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
  generate-streamdeck-mk2.mjs
  verify-canvas.mjs
streamdeck/
  mk2/
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
  | "depolarize"
  | "dephase"
  | "ampdamp"
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
3. updates the exact simulator state
4. updates classical bits for measurement
5. appends measurement records when applicable
6. stores an immutable execution snapshot for visualization

The simulator currently has two backends:

- `statevector`: pure-state state vector execution
- `density-matrix`: full density matrix execution using `rho' = U rho U dagger`
- noise channels use Kraus maps `rho' = sum_k E_k rho E_k dagger`

The application uses the density-matrix backend by default so visualization can consume full density matrices directly. The statevector backend remains available for pure-state execution and tests.

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
  densityMatrix?: Complex[][];
  classicalBits: number[];
  measurementLog: MeasurementRecord[];
  appliedOp?: GateOp;
};
```

The simulator state remains exact and discrete. The renderer may interpolate visual state between exact snapshots.

When `densityMatrix` is present, Bloch vectors and correlation matrices are computed from that density matrix. Otherwise they are computed from the pure-state `statevector`.

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
depolarize(1) q[0];
dephase(1) q[0];
ampdamp(0.2) q[0];
```

The editor palette currently exposes:

- `h`, `x`, `y`, `z`, `s`, `S+`, `t`, `T+`
- `rx`, `ry`, `rz` with an editor angle input in degrees
- `depolarize`, `dephase`, and `ampdamp` with an editor probability input

`S+` and `T+` are displayed in the editor as the inverse phase gates and are exported as standard OpenQASM `sdg` and `tdg`.

The parser and simulator also support `id`.

Noise operations are app-specific OpenQASM 2.0 extensions and require the density-matrix backend:

- `depolarize(p)` mixes a qubit toward `I/2`; `p=1` gives a fully mixed single-qubit state
- `dephase(p)` damps coherences in the computational basis; `p=1` fully removes off-diagonal terms
- `ampdamp(p)` applies amplitude damping from `|1>` toward `|0>`

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
2. samples a measurement outcome with fresh randomness
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
- control qubit selector shown only for controlled/two-qubit gates
- degree input for `rx`, `ry`, and `rz`
- probability input for noise channels
- append selected gate
- delete existing gate
- select an execution step from the operation strip
- OpenQASM import/export through a modal QASM editor opened by a button
- circuit timeline SVG
- automatic horizontal scrolling so the current execution step remains centered where possible
- left editor panel can be hidden to give the visualization full width
- top-level transport controls

### Not Yet Implemented

- drag-and-drop editing
- moving gates
- inline parameter editing
- undo/redo
- multi-register editing

### Circuit Layout

- horizontal axis: timestep
- vertical axis: qubit line
- the left editor/circuit region is intentionally narrower than the visualization region
- the visualization region receives more horizontal space for Bloch sphere readability

Example:

```txt
q0 --H----*---------M----
          |
q1 -------X--------------
```

---

## Simulation Engine

Backends:

```txt
statevector simulation:
  |psi> in C^(2^n)

density-matrix simulation:
  rho in C^(2^n x 2^n)
```

The main application currently uses the density-matrix backend by default. The statevector backend remains available through the simulator API for pure-state execution and regression tests.

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

### Connected Correlation Matrix

```txt
C_ab = Tr(rho_ij sigma_a tensor sigma_b) - Tr(rho_i sigma_a) Tr(rho_j sigma_b)
```

where:

```txt
a, b in {x, y, z}
```

The UI displays the 3x3 connected correlation matrix for a user-selected qubit pair when the circuit has at least two qubits. Product states therefore display as the zero matrix.

---

## Visualization

### Bloch Sphere View

The renderer displays:

- one to three selected Bloch spheres
- semi-transparent sphere surface
- latitude lines
- longitude lines
- three reference axes
- animated Bloch vector
- purity label

Users can choose which qubits are shown as Bloch spheres. The UI allows one to three selected qubits so the stereoscopic view stays readable.

Users can also choose the qubit pair used for the displayed 3x3 connected correlation matrix.

The Bloch sphere renderer additionally displays:

- large axis labels:
  - `|0>` and `|1>` on the Bloch Z axis
  - `|+>` and `|->` on the Bloch X axis
  - `|i>` and `|-i>` on the Bloch Y axis
- a low-opacity floor grid behind the Bloch sphere
- a low-opacity wireframe cube enclosing the Bloch sphere
- depth rings and front/back markers for stereoscopic readability

Axis labels are rendered as canvas-text sprites with dark outlines so they remain readable in both 2D and anaglyph stereo modes.

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
- camera reset button restores the Bloch view with `|0>` on the screen-up axis
- the renderer moves the camera slightly closer when stereo mode is active
- stereo focus is exposed as a user-adjustable value

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

Stereo mode uses a local adjustable anaglyph effect based on Three.js `AnaglyphEffect`.

The UI exposes:

- stereo on/off toggle
- eye separation
- stereo focus
- red image gain
- cyan image gain

Current implementation details:

- canvas is visually adjusted with reduced saturation and stable contrast
- eye separation range is `0.04` to `0.30`
- stereo focus range is `2.8` to `8.0`
- red and cyan image gain controls support imperfect red/cyan glasses
- stereo rendering uses a separation-first shader mode to reduce ghosting

The renderer must remain readable in both 2D and anaglyph mode.

Recommended calibration workflow for anaglyph stereo:

1. Enable stereo mode.
2. Adjust red and cyan image gains until each eye sees primarily its intended channel.
3. Adjust eye separation until the Bloch sphere, floor grid, and bounding cube have clear but comfortable parallax.
4. Adjust stereo focus so axis labels, grid lines, and the Bloch vector remain stable and readable.
5. Verify that Bloch sphere labels, grid lines, vector, floor grid, and bounding cube remain readable.

---

## Presets

The current application exposes nine preset circuits from a top toolbar pull-down:

1. `|0>` one-qubit initial state
2. `|00>` two-qubit initial state
3. `|000>` three-qubit initial state
4. Bell state generation with 2 qubits
5. product mixed state `I/2 x I/2`
6. GHZ state generation with 3 qubits
7. H-CZ measurement circuit with 3 qubits
8. random two-qubit product state followed by SWAP decomposed into three `cx` gates
9. quantum teleportation with a random Alice input state

### Initial State Presets

The initial-state presets contain no gates. They only define the quantum and classical register sizes.

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[1];
```

The `|00>` and `|000>` presets use the same structure with `qreg` and `creg` sizes of 2 and 3.

### Bell State Preset

The Bell preset prepares:

```txt
(|00> + |11>) / sqrt(2)
```

Implemented circuit:

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
```

### Product Mixed State Preset

The product mixed-state preset prepares `I/2 x I/2` by depolarizing both qubits from `|00>`.

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
depolarize(1) q[0];
depolarize(1) q[1];
```

This preset has the same single-qubit Bloch-sphere appearance as the Bell preset: both reduced states are maximally mixed and their Bloch vectors sit at the origin. Unlike the Bell preset, its connected correlation matrix is zero because it is a product state.

### GHZ State Preset

The GHZ preset prepares:

```txt
(|000> + |111>) / sqrt(2)
```

Implemented circuit:

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
h q[0];
cx q[0], q[1];
cx q[0], q[2];
```

### H-CZ Measurement Preset

This preset matches the demonstration circuit:

```qasm
OPENQASM 2.0;
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
```

The `h q[2]; cz q[1], q[2]; h q[2];` sequence is visually useful because it presents the controlled operation as a CZ-style interaction while still making the target-basis change explicit.

### Random Swap Preset

The random-swap preset prepares independent random pure states on `q0` and `q1`, then swaps them using the standard three-`cx` decomposition.

Implemented circuit:

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
ry(theta0) q[0];
rz(phi0) q[0];
ry(theta1) q[1];
rz(phi1) q[1];
cx q[0], q[1];
cx q[1], q[0];
cx q[0], q[1];
```

Each random qubit state samples `theta = acos(1 - 2u)` and `phi = 2 pi v`.

The simulator also executes `swap` operations through this three-`cx` decomposition rather than a separate statevector-specialized swap path.

### Teleportation Preset

The teleportation preset prepares a random pure input state on Alice's qubit `q0`, creates a Bell pair on `q1/q2`, performs Bell measurement on `q0/q1`, and conditionally reconstructs the state on `q2`.

The random Alice state is generated by sampling Bloch-sphere angles and emitting:

```qasm
ry(theta) q[0];
rz(phi) q[0];
```

where `theta = acos(1 - 2u)` and `phi = 2 pi v` for independent uniform random values `u, v in [0, 1)`.

Implemented circuit:

```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[2];
ry(theta) q[0];
rz(phi) q[0];
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

In `examples/single-qubit`, returning to a pre-measurement history entry and moving forward into an existing measurement entry re-samples that measurement. Any later gate states in the example history are recomputed from the new collapsed state so the displayed history remains consistent.

In the main circuit editor, execution re-samples the measurement being entered with fresh randomness when navigation moves forward into a measurement snapshot. Measurement outcomes from earlier snapshots are preserved and passed back to the simulator as fixed prior outcomes, so stepping into a later measurement does not re-roll earlier measurements.

The current visualization shows state evolution, collapse, classical bits, correlations, and reconstructed target-state Bloch vector. It does not yet show explicit classical communication arrows or a dedicated teleportation narrative panel.

---

## Stream Deck Plan

Stream Deck can currently trigger core actions by sending keyboard shortcuts. Direct Stream Deck SDK integration is not implemented yet.

Implemented keyboard mappings:

- previous step: `ArrowLeft`
- next step: `ArrowRight`
- reset execution: `R` or `Home`
- toggle circuit editor panel: `E`
- add selected gate: `+` or numpad `+`
- rotate Bloch view while held: `C` plus mouse movement
- zoom Bloch view while held: `Z` plus vertical mouse movement

The repository includes `scripts/generate-streamdeck-mk2.mjs`, exposed as:

```sh
npm run streamdeck:mk2
```

It generates SVG key images and a `keymap.json` guide under `streamdeck/mk2/`.

Target actions:

- reset
- previous step
- next step
- autoplay/pause
- stereo toggle
- preset selection
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
- editing parameters on existing gates
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
- camera presets
- red/green-specific anaglyph matrix option in addition to red/cyan
- GPU acceleration
- tensor-network backend
- additional noise channels
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
