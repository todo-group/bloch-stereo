# Bloch Stereo Quantum Circuit Editor Specification
Version: 0.3
---
# Overview
This project extends Bloch Stereo into an interactive stereoscopic quantum circuit visualization environment.
The system combines:
- lightweight quantum circuit editing
- OpenQASM import/export
- step-by-step execution
- animated Bloch-sphere visualization
- reduced density matrix visualization
- entanglement visualization
- stereoscopic rendering
- exhibition-oriented interaction design
The system is intended for:
- science museums
- public exhibitions
- educational demonstrations
- quantum information visualization
- interactive learning
- small-scale quantum circuit exploration
The design priorities are:
- intuitive understanding
- real-time feedback
- visually smooth transitions
- stereoscopic depth perception
- browser-based execution
- lightweight operation
---
# Core Features
The system SHALL support:
1. OpenQASM 2.0 import/export
2. Lightweight quantum circuit editor
3. Circuit visualization
4. Step-by-step execution
5. Animated Bloch-vector transitions
6. Single-qubit reduced density matrix visualization
7. Two-qubit reduced density matrix visualization
8. Correlation matrix visualization
9. Quantum teleportation visualization
10. Red-green stereoscopic rendering
11. Stream Deck integration
12. Trackball-oriented interaction
---
# Scope
## Included
- OpenQASM 2.0
- pure-state simulation
- measurement
- conditional execution
- reduced density matrices
- stereoscopic rendering
- animated visualization
- browser execution
- teleportation demonstration
## Excluded (initial version)
- OpenQASM 3 control flow
- GPU acceleration
- hardware backend execution
- noise simulation
- pulse-level programming
- tensor-network backend
---
# Target Hardware
## Display
- standard 2D monitor
- red-green anaglyph stereoscopic display
---
# Input Devices
## Right Hand
Primary device:
- Elecom HUGE PLUS trackball
---
# Left Hand
Secondary device:
- Elgato Stream Deck MK.2 (15-key)
---
# Interaction Philosophy
The interaction model SHALL support operation while:
- wearing red-green stereoscopic glasses
- viewing the display continuously
- minimizing keyboard usage
- minimizing precise mouse motion
The system SHALL optimize for:
- large targets
- low cursor travel
- one-touch operations
- exhibition robustness
---
# Architecture
```txt
+-----------------------+
| Circuit Editor UI     |
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

⸻

Technology Stack

Frontend

* TypeScript
* React
* Vite

⸻

Rendering

* Three.js
* WebGL

⸻

State Management

* Zustand

⸻

Circuit Representation

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

⸻

Execution Model

Execution SHALL be step-based.

Each step SHALL:

1. apply one gate
2. update statevector
3. update classical bits
4. store execution snapshot
5. update visualization

⸻

Execution State

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
};

⸻

OpenQASM Support

Supported Version

* OpenQASM 2.0

⸻

Supported Statements

Registers

qreg q[3];
creg c[2];

⸻

Single-Qubit Gates

x q[0];
y q[0];
z q[0];
h q[0];
s q[0];
t q[0];
rx(pi/2) q[0];
ry(pi/2) q[0];
rz(pi/2) q[0];

⸻

Two-Qubit Gates

cx q[0], q[1];
cz q[0], q[1];
swap q[0], q[1];

⸻

Measurement

measure q[0] -> c[0];

⸻

Conditional Execution

if (c==1) x q[0];

⸻

Circuit Editor

The editor SHALL support:

* add gate
* delete gate
* move gate
* drag-and-drop editing
* parameter editing
* OpenQASM import/export
* keyboard shortcuts

⸻

Circuit Layout

* horizontal axis: timestep
* vertical axis: qubit line

Example:

q0 ──H────●────────────
          │
q1 ───────X────M───────

⸻

Simulation Engine

Method

Statevector simulation.

|ψ⟩ ∈ ℂ^(2^n)

⸻

Initial Performance Target

* 1–8 qubits
* ≤ 200 gates
* real-time interaction

⸻

Measurement

Measurement SHALL:

1. compute probabilities
2. sample outcomes
3. collapse statevector
4. update classical registers
5. store measurement logs

⸻

Reduced Density Matrix

Single-Qubit Reduction

For qubit i:

[
\rho_i = \mathrm{Tr}_{\bar{i}} |\psi\rangle\langle\psi|
]

⸻

Bloch Vector

[
r_x = \mathrm{Tr}(\rho X)
]

[
r_y = \mathrm{Tr}(\rho Y)
]

[
r_z = \mathrm{Tr}(\rho Z)
]

⸻

Two-Qubit Reduction

[
\rho_{ij}=\mathrm{Tr}_{\overline{ij}}|\psi\rangle\langle\psi|
]

⸻

Correlation Matrix

[
C_{\alpha\beta}=\mathrm{Tr}(\rho_{ij}\sigma_\alpha\otimes\sigma_\beta)
]

where:

α, β ∈ {x, y, z}

⸻

Visualization

Single-Qubit View

The renderer SHALL display:

* stereoscopic Bloch sphere
* Bloch vector
* purity indication
* optional trajectory history

⸻

Bloch Sphere Grid

Bloch spheres SHALL display faint globe-like grids.

The grid SHALL include:

* latitude lines
* longitude lines

⸻

Grid Rendering Requirements

* thin lines
* semi-transparent rendering
* unobtrusive appearance
* configurable visibility

⸻

Grid Parameters

type BlochSphereGridOptions = {
  visible: boolean;
  latitudeCount: number;
  longitudeCount: number;
  opacity: number;
  lineWidth: number;
};

Default values:

visible = true
latitudeCount = 7
longitudeCount = 12
opacity = 0.18
lineWidth = 1

⸻

Two-Qubit View

The renderer SHALL display:

* Bloch sphere for qubit A
* Bloch sphere for qubit B
* 3×3 correlation matrix
* optional entanglement indicator

⸻

Animated Step Transitions

Bloch vectors SHALL move continuously between execution steps.

⸻

Animation Requirements

* smooth interpolation
* configurable duration
* interruptible transitions
* next/previous support
* autoplay support

Default duration:

400 ms

⸻

Bloch Vector Interpolation

[
\mathbf{r}(t)=(1-s(t))\mathbf{r}_0+s(t)\mathbf{r}_1
]

with:

[
s(t)=3t^2-2t^3
]

⸻

Mixed-State Animation

Mixed-state Bloch-vector length SHALL interpolate continuously.

Vectors SHALL NOT be normalized during interpolation.

⸻

Correlation Matrix Animation

[
C_{\alpha\beta}(t)=(1-s(t))C_{\alpha\beta}^{(0)}+s(t)C_{\alpha\beta}^{(1)}
]

⸻

Measurement Visualization

Measurement collapse SHALL still animate continuously for visualization purposes.

The UI SHOULD indicate that this is visual interpolation rather than physical time evolution.

⸻

Gate-Aware Animation

The renderer MAY animate single-qubit gates using geometric Bloch-sphere rotations.

Examples:

* rx
* ry
* rz
* x
* y
* z

Initial implementation MAY use linear interpolation.

⸻

Display Modes

The renderer SHALL support:

1. Standard 2D mode
2. Red-green stereoscopic mode

⸻

2D Mode

2D mode SHALL support:

* bright colors
* vivid gate coloring
* colorful Bloch vectors
* colorful correlation matrices

⸻

Red-Green Stereo Mode

Anaglyph stereoscopic mode SHALL support:

* left-eye red rendering
* right-eye green/cyan rendering
* adjustable eye separation
* depth-enhanced rendering

⸻

Stereo Mode Switching

Users SHALL be able to switch dynamically between:

* 2D mode
* stereoscopic mode

without restarting the application.

⸻

Stereo Rendering Settings

type DisplayMode =
  | "2d"
  | "anaglyph-red-green";
type StereoSettings = {
  enabled: boolean;
  eyeSeparation: number;
  convergenceDistance: number;
  preserveBrightness: boolean;
};

⸻

Stereo Rendering Adaptation

When stereo mode is enabled:

* saturation MAY be reduced
* contrast MAY be adjusted
* grid opacity MAY be reduced

The renderer SHALL preserve readability.

⸻

Trackball Interaction

The system SHALL optimize interaction for:

* Elecom HUGE PLUS trackball

⸻

Trackball Usage

The trackball SHALL support:

* camera rotation
* gate selection
* drag-and-drop editing
* timeline scrubbing
* Bloch sphere manipulation

⸻

Recommended Bindings

Left Click:
  select / place gate
Right Click:
  delete gate / context menu
Trackball Movement:
  rotate camera
Wheel:
  zoom

⸻

Stream Deck Integration

The system SHALL support:

* Elgato Stream Deck MK.2

⸻

Stream Deck Functions

The Stream Deck SHALL support:

* gate insertion
* execution control
* visualization toggles
* teleportation preset loading
* camera reset
* stereo-mode switching

⸻

Default Stream Deck Layout

+-------------------------------+
| Undo | Redo | Reset | Run     |
| Prev | Next | Auto  | Pause   |
| H    | X    | Y     | Z       |
| CX   | M    | QASM  | Stereo  |
+-------------------------------+

⸻

Quantum Teleportation Preset

The system SHALL provide an educational teleportation demonstration.

⸻

Teleportation Circuit

OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[2];
h q[1];
cx q[1], q[2];
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];
if (c==1) x q[2];
if (c==2) z q[2];

⸻

Teleportation Visualization

The visualization SHALL display:

1. input state
2. Bell-pair generation
3. entanglement correlations
4. measurement collapse
5. classical communication
6. correction operations
7. reconstructed state

⸻

Measurement Modes

Random Mode

Measurement outcomes sampled probabilistically.

⸻

Forced Branch Mode

User-selectable branches:

* 00
* 01
* 10
* 11

⸻

File Structure

src/
  circuit/
    CircuitEditor.tsx
    CircuitCanvas.tsx
    GatePalette.tsx
    qasm2/
      parser.ts
      exporter.ts
    simulator/
      simulator.ts
      gates.ts
      measurement.ts
      density.ts
  stereo/
    BlochSphereStereo.tsx
    CorrelationMatrixStereo.tsx
    StereoRenderer.tsx
  presets/
    teleportation.qasm

⸻

Performance Targets

The system SHOULD maintain:

* 60 FPS in 2D mode
* ≥ 45 FPS in stereo mode

for:

* ≤ 8 qubits
* ≤ 200 gates

⸻

Future Extensions

Possible future extensions:

* OpenQASM 3
* GPU acceleration
* tensor-network backend
* noise simulation
* WebXR support
* quantum error correction visualization

⸻

Development Phases

Phase 1

* circuit IR
* circuit rendering
* statevector simulator
* Bloch sphere rendering

⸻

Phase 2

* OpenQASM parser/exporter
* density matrix reduction
* step execution

⸻

Phase 3

* animation system
* teleportation visualization
* measurement visualization

⸻

Phase 4

* stereoscopic optimization
* Stream Deck optimization
* exhibition hardening

⸻

Success Criteria

The project SHALL be considered successful if:

1. circuits can be edited interactively
2. OpenQASM import/export works
3. teleportation becomes visually understandable
4. Bloch vectors animate smoothly
5. entanglement becomes visually intuitive
6. stereoscopic rendering works reliably
7. the system operates interactively in a browser


