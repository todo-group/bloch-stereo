# Bloch Stereo Quantum Circuit Editor Specification

Version: 0.7
Last updated: 2026-08-23

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

Version 0.7 implements the browser-side Meta Quest 3S WebXR design. Capability probing, immersive sessions, XR controls, controller and hand input, adaptive quality, and IWER regression coverage are implemented. Physical Quest 3S acceptance remains pending; support is not considered hardware-validated until the physical-device criteria pass.

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
- Stream Deck-friendly controls for previous, next, hovered button/select activation, mouse click, reset, editor hide/show, gate insertion, top/view/bottom camera presets, and held camera control
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
- reusable presentation-neutral `BlochSceneContent` Three.js scene module
- allocation-free Bloch-vector interpolation hot path using preallocated vector buffers
- desktop and mobile canvas verification for both 2D and red/cyan anaglyph modes
- WebXR capability detection and recoverable immersive session lifecycle
- Meta Quest Touch Plus ray controls and optional hand-pinch input
- in-XR transport, recenter, preset, visible-qubit, and correlation-pair controls
- Quest spatial layout, fixed-foveation defaults, adaptive decoration quality, and frame-time monitoring
- development-only Meta Quest 3 IWER runtime and automated WebXR regression script
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
- physical Meta Quest 3S acceptance testing for the implemented WebXR presentation

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

Implemented target display pending physical-device acceptance:

3. Meta Quest 3S through Meta Quest Browser and WebXR `immersive-vr`

The existing red/cyan anaglyph mode for red-blue 3D glasses remains a supported first-class presentation mode after Quest support is added. Anaglyph and WebXR are separate presentation paths: anaglyph post-processing MUST continue to work on ordinary 2D displays, but MUST NOT be applied during an immersive WebXR session because the XR compositor supplies the left-eye and right-eye views. Adding WebXR MUST NOT remove, hide, rename, or reduce the existing anaglyph calibration controls.

### Meta Quest 3S

Meta Quest 3S is the first standalone headset target. Support means browser delivery rather than a native Horizon OS package:

- current stable Meta Quest Browser
- WebXR `immersive-vr` session
- tracked-head rendering
- Meta Quest Touch Plus controllers as the required immersive input path
- hand tracking as a progressive enhancement, not a launch blocker
- continued non-immersive operation in the Quest Browser window when WebXR is unavailable or permission is denied

The production site MUST be delivered over HTTPS. Local development may use a browser-recognized secure localhost context or an HTTPS development endpoint reachable by the headset.

The application MUST detect support with `navigator.xr?.isSessionSupported("immersive-vr")`. It MUST show **Enter VR** only when supported, show a concise unavailable state otherwise, and request the immersive session only from an explicit user action.

The initial Quest scope is a focused visualization and playback experience. Circuit construction, QASM text editing, and detailed numeric settings remain available in the 2D browser page before or after the immersive session. The immersive view MUST provide:

- previous step
- next step
- reset
- autoplay/pause
- exit VR
- current step and active operation
- preset selection
- visible-qubit selection for one to three Bloch spheres
- correlation-pair selection when at least two qubits exist

Full in-XR gate editing, QASM keyboard entry, passthrough mixed reality, room meshing, anchors, and multi-user sessions are outside the first Quest milestone.

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

The current version supports Stream Deck use through ordinary keyboard and mouse-button actions. It does not yet communicate with Stream Deck hardware through the SDK.

### Implemented Interaction Model

- left click selects steps and controls
- left and right arrow keys move to the previous and next execution step
- `R` or `Home` resets execution
- `+` or numpad `+` appends the selected gate
- `Space` activates the hovered button or selector when focus is not inside a text entry control
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
             | Shared Visualization Scene Model     |
             +--------------------------------------+
                    |                       |
                    v                       v
       +------------------------+  +------------------------+
       | Desktop / Anaglyph     |  | WebXR Presentation     |
       | Presentation           |  | and XR Interaction     |
       +------------------------+  +------------------------+
```

The simulator, circuit state, and exact execution snapshots remain presentation-independent. Desktop, red/cyan anaglyph, and WebXR presentations consume the same immutable snapshot data. XR controller events dispatch the same store actions used by the React transport controls. WebXR support is additive and MUST NOT replace the existing red-blue-glasses workflow.

### Technology Stack

Frontend:

- TypeScript
- React
- Vite

Rendering:

- Three.js
- WebGL
- WebXR Device API for Meta Quest 3S immersive presentation
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
    AdjustableAnaglyphEffect.ts
    BlochSceneContent.ts
    BlochSceneContent.test.ts
    BlochSphereStereo.tsx
    CorrelationMatrixStereo.tsx
  xr/
    XrCapability.ts
    XrControlPanel.ts
    XrInteraction.ts
    XrQualityController.ts
    XrScene.ts
    XrSessionController.ts
    setupXrEmulation.ts
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

Implemented Quest-specific modules:

```txt
src/
  stereo/
    BlochSceneContent.ts
  xr/
    XrCapability.ts
    XrSessionController.ts
    XrScene.ts
    XrInteraction.ts
    XrControlPanel.ts
    XrQualityController.ts
```

`BlochSceneContent` will own reusable Three.js scene objects without owning a camera, renderer, DOM events, or animation loop. `BlochSphereStereo` will retain the desktop/anaglyph adapter, while `XrScene` will provide the XR camera, session lifecycle, spatial layout, and headset input. This split prevents XR behavior from becoming conditional branches throughout one monolithic renderer.

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
- in-scene qubit label above each selected sphere
- purity label

Users can choose which qubits are shown as Bloch spheres. The UI allows one to three selected qubits so the stereoscopic view stays readable.
Selected Bloch spheres are always arranged left-to-right by qubit index, independent of selection order.

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
r(t) = lerp(|r0|, |r1|, s(t)) * slerp(normalize(r0), normalize(r1), s(t))
s(t) = 3t^2 - 2t^3
```

Equal-length vectors preserve their length during interpolation instead of cutting through the Bloch sphere interior.
Mixed-state vectors are not normalized during interpolation; their visual length interpolates between exact reduced-state lengths.

### Camera Interaction

Implemented camera behavior:

- pointer drag changes yaw and pitch velocity
- yaw and pitch use damping
- pitch is clamped for comfort
- wheel changes camera radius
- camera always looks at the scene origin
- camera reset button restores the Bloch view with `|0>` on the screen-up axis
- top and bottom view buttons show the Bloch sphere from near the positive and negative Z axes
- the renderer moves the camera slightly closer when stereo mode is active
- stereo focus is exposed as a user-adjustable value

### Measurement Visualization

Measurement collapse is represented by smooth visual interpolation between exact pre-measurement and post-measurement snapshots.

The exact simulator state is not modified for visual interpolation.

---

## Meta Quest 3S WebXR Design

### Session And Rendering Lifecycle

The Quest implementation MUST use the existing `THREE.WebGLRenderer`; it MUST NOT create a second WebGL context when entering XR.

Required setup:

```ts
renderer.xr.enabled = true;
renderer.setAnimationLoop(renderFrame);
```

`renderer.setAnimationLoop` replaces the current direct `window.requestAnimationFrame` loop for both desktop and immersive rendering. This keeps a single update path and allows the WebXR runtime to schedule headset frames.

The application SHOULD request:

```ts
const sessionInit: XRSessionInit = {
  optionalFeatures: ["local-floor", "hand-tracking"],
};
```

After `requestSession` resolves and before passing the session to the renderer, the implementation selects `local-floor` when the granted session exposes that feature; otherwise it calls `renderer.xr.setReferenceSpaceType("local")`. `local-floor` is preferred for stable exhibit placement, while `local` is the required fallback. Hand tracking MUST be optional so controller operation remains available when hand permission or tracking is unavailable.

Session lifecycle requirements:

1. Probe `immersive-vr` support after page load without opening a session.
2. Start a session only from the visitor's **Enter VR** activation.
3. Preserve the current circuit, execution step, selected preset, visible qubits, and correlation pair across entry and exit.
4. Preserve autoplay on entry, but stop it when the session becomes hidden or ends so playback cannot continue unseen.
5. Release controller, hand, ray, and session event listeners on session end.
6. Restore the ordinary 2D canvas and controls without reloading the application.
7. Present a recoverable error in the browser page if permission, session creation, or WebGL initialization fails.

The XR session state is transient runtime state and MUST remain separate from `DisplayMode`. `DisplayMode` continues to represent `2d` or `anaglyph-red-green`; an XR session temporarily owns presentation while active. This avoids persisting an invalid `xr` display setting across reloads or unsupported devices.

The current `visibleQubits` and `correlationPair` values are local React state in `App`. They MUST move into shared visualization state, or an equivalent presentation-neutral owner, before XR controls are added. Desktop and XR views MUST not maintain divergent selections.

### Spatial Layout And Comfort

WebXR world units MUST be treated as meters. Existing scene dimensions are illustration units and MUST be placed under a scaleable `contentRoot` before use in XR.

Initial ergonomic layout:

- head motion controls the view; application code MUST NOT rotate or translate the XR camera
- scene origin uses a standing `local-floor` reference when available
- Bloch-sphere centers appear approximately `1.2` to `1.6 m` above the floor
- primary content begins approximately `1.3` to `2.0 m` in front of the visitor
- a Bloch sphere has an initial physical diameter of approximately `0.35` to `0.45 m`
- the three-sphere layout fits within a comfortable central field of view without requiring head rotation for core transport controls
- the control panel is below or beside the spheres and does not occlude vectors, labels, or correlations
- content placement can be recentered from an always-available XR control

The XR experience MUST NOT implement forced locomotion, continuous artificial camera rotation, head bob, or abrupt world movement. Existing pointer-driven inertial camera controls apply only outside XR. Optional content-root rotation or scaling, if later added, MUST be damped, bounded, and disabled while a UI ray is selecting a control.

The current floor grid, bounding cubes, depth rings, and labels SHOULD be simplified for true binocular stereo. Their purpose is spatial reference, not decoration. Text sprites MUST face the visitor or use a stable panel orientation; they MUST remain readable without being attached to the head at an uncomfortable depth.

### Immersive User Interface

The existing React DOM is not assumed to be visible or interactive inside an immersive session. Required XR controls MUST therefore be rendered as Three.js scene objects and connected to shared application actions.

XR controls MUST meet these rules:

- use large targets with a minimum initial face size of approximately `0.04 m` in each interactive dimension at arm's-length panel distance
- show distinct idle, hover, pressed, disabled, and focused states without relying on red/green color discrimination
- include text or shape cues in addition to color
- keep **Exit VR**, **Reset**, **Prev**, **Next**, and **Pause** directly reachable
- provide audio-free visual confirmation of activation
- debounce activation so one trigger press advances only one step
- prevent activation through nearer objects by choosing the closest valid ray intersection
- preserve all exact simulator behavior, including measurement resampling rules

Long QASM text, dense gate palettes, numeric slider calibration, and modal dialogs MUST NOT be reproduced in the first immersive UI. If a visitor requests one of those tasks, the UI directs them to exit VR and use the Quest Browser page.

### Controller And Hand Input

Touch Plus controllers are the baseline input method.

For each connected controller, the implementation MUST use:

- `renderer.xr.getController(index)` for target-ray pose and selection events
- `renderer.xr.getControllerGrip(index)` for the visible controller model when available
- a high-contrast ray and endpoint cursor
- `selectstart`, `selectend`, `connected`, and `disconnected` lifecycle events

The primary trigger activates the nearest intersected control. Either controller may operate the UI; the implementation MUST not require a fixed dominant hand. Thumbsticks and grip buttons are optional shortcuts and MUST NOT be the only way to reach a required action.

Hand tracking is a progressive enhancement using `renderer.xr.getHand(index)`. A pinch may map to the same abstract `select` action as a controller trigger. If hands are lost, low-confidence, or unavailable, controls remain operable with controllers. The first milestone does not require direct grabbing of Bloch spheres or gates.

All XR input paths MUST feed a presentation-neutral command layer such as:

```ts
type ExhibitionCommand =
  | "previous-step"
  | "next-step"
  | "reset"
  | "toggle-autoplay"
  | "recenter"
  | "exit-xr";
```

Keyboard, Stream Deck, DOM buttons, XR controllers, and hand pinch may map into the same command layer.

### Quest Rendering Quality

The first Quest milestone targets stable `72 FPS` (`13.9 ms` per frame or less) throughout a session. `90 FPS` is a stretch goal after the 72 FPS acceptance target is met. The application MUST prefer stable frame delivery over maximum mesh density or transparency quality.

Quest-specific rendering requirements:

- render native XR stereo through the WebXR compositor; never use `AdjustableAnaglyphEffect` in XR
- configure framebuffer scale and fixed foveation, when supported, before the XR session starts
- begin with conservative framebuffer scale and moderate fixed foveation, then tune on physical Quest 3S hardware
- avoid full-screen post-processing and extra render passes in XR
- share sphere, grid, axis, arrow, and panel geometry/material resources
- preallocate Bloch-vector interpolation vectors and raycasting scratch objects
- eliminate the current per-frame `clone`, `map`, and temporary-vector allocations from XR hot paths
- reduce sphere segment counts, transparency layers, depth guides, and label texture resolution through an XR quality profile
- cap simultaneously visible Bloch spheres at three
- suspend hidden DOM-only visualization work while immersive presentation is active
- perform density-matrix simulation and snapshot changes only when circuit state or execution step changes, never once per XR frame

Adaptive quality MAY lower framebuffer scale or decorative detail after sustained missed frames. It MUST use measured frame timing and capability checks rather than Quest user-agent sniffing. It MUST apply hysteresis so quality does not flicker between levels.

### Capability And Failure Behavior

The application MUST remain useful in every capability state:

| State | Required behavior |
| --- | --- |
| No `navigator.xr` | Keep 2D/anaglyph modes; hide **Enter VR** and explain that WebXR is unavailable. |
| `immersive-vr` unsupported | Keep browser visualization and show a non-blocking unsupported message. |
| Session denied | Keep the circuit and step unchanged and allow retry. |
| Controller disconnected | Continue head-tracked viewing and accept another controller or hand if available. |
| Hand tracking unavailable | Continue with Touch Plus controllers without warning noise. |
| Reference space reset | Reapply a comfortable content-root placement without changing simulator state. |
| Session ended unexpectedly | Stop autoplay, clean up XR resources, and return to the 2D page. |
| Performance budget missed | Reduce optional visual quality before removing labels, vectors, or transport controls. |

No feature essential to understanding the quantum state may depend only on haptics, audio, hand tracking, or a single controller.

### Implementation Sequence

The Quest work SHOULD be delivered in the following order:

1. Extract reusable scene content and remove per-frame allocations from the render path.
2. Convert the renderer to `setAnimationLoop` and verify unchanged desktop/anaglyph behavior.
3. Add capability probing, **Enter VR**, XR session lifecycle, and a scaled static Bloch scene.
4. Add controller rays and the minimum transport, exit, and recenter panel.
5. Add step/preset/qubit/correlation status and selection controls.
6. Add the Quest quality profile and frame-time instrumentation.
7. Add optional hand pinch input.
8. Run emulator regression tests and the physical Quest 3S acceptance pass.

Each step MUST preserve exact simulator state and both existing non-XR modes: standard 2D and red/cyan anaglyph for red-blue 3D glasses.

Implementation status:

- Step 1 completed on 2026-08-16: reusable scene content was extracted into `BlochSceneContent`, interpolation buffers were preallocated, and 2D/anaglyph visual regression coverage was expanded.
- Steps 2 through 7 completed on 2026-08-16: the shared animation loop, session lifecycle, spatial scene, controller panel, shared selections, adaptive quality, and optional hand pinch input were implemented.
- Step 8 automated coverage completed on 2026-08-16: unit, build, 2D/anaglyph canvas, repeated-session, Touch Plus controller, and hand-pinch IWER regressions pass.
- Step 8 physical Quest 3S acceptance remains pending and MUST be completed on current stable headset software before hardware support is declared complete.

### Quest Acceptance Criteria

Meta Quest 3S support is complete only when all of the following pass on a physical device using the current stable Meta Quest Browser:

1. The production HTTPS URL loads without sideloading a native application.
2. **Enter VR** appears only when `immersive-vr` is supported and opens from one visitor action.
3. Entering and leaving VR five consecutive times does not duplicate canvases, controls, listeners, or animation loops.
4. Head tracking is one-to-one and no application camera motion causes discomfort.
5. Either Touch Plus controller can operate Prev, Next, Reset, Auto/Pause, recenter, preset, qubit selection, correlation-pair selection, and Exit VR.
6. Bell, GHZ, mixed-product, random-swap, and teleportation demonstrations retain the same snapshots and measurement behavior as desktop mode.
7. Bloch vectors animate smoothly, mixed-state vector length remains correct, and labels are readable from the default placement.
8. The scene sustains 72 FPS during the three-sphere GHZ and teleportation demonstrations for a 10-minute session, with no repeated long-frame stutter.
9. Controller disconnect/reconnect, browser focus loss, permission denial, and unexpected session end recover without losing the circuit.
10. The complete visitor flow can be operated without a physical keyboard, although QASM text editing remains outside XR.
11. After XR entry and exit, the existing Stereo toggle still enables red/cyan anaglyph rendering on an ordinary display, and eye separation, focus, red gain, cyan gain, and reset calibration behave as before.

---

## Display Modes

### Standard 2D Mode

2D mode supports:

- vivid gate colors
- colored Bloch vectors
- colorful but restrained correlation matrix cells
- full brightness rendering
- orthographic camera projection so parallel grid and guide lines remain visually parallel

### Red-Green/Cyan Stereo Mode

Stereo mode uses a local adjustable anaglyph effect based on Three.js `AnaglyphEffect`.
Stereo rendering uses perspective camera projection to preserve comfortable depth cues.

This mode is the supported path for conventional red-blue/red-cyan 3D glasses and remains available independently of Meta Quest support. It MUST continue to switch on and off without restarting the application. WebXR implementation work MUST preserve its shader, perspective-camera behavior, calibration ranges, keyboard toggle, and toolbar controls.

The UI exposes:

- stereo on/off toggle
- eye separation
- stereo focus
- red image gain
- cyan image gain
- reset-to-default calibration button

Current implementation details:

- canvas is visually adjusted with reduced saturation and stable contrast
- stereo calibration controls are disabled and visually muted while 2D mode is active
- default stereo calibration is eye separation `0.12`, focus `4.2`, red gain `1.00`, and cyan gain `0.82`
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

### Meta Quest WebXR Mode

WebXR mode uses true binocular stereo supplied by the headset runtime. It uses a perspective XR camera and tracked head pose, ignores the desktop eye-separation/focus/channel-gain settings, and shows no anaglyph calibration controls inside XR.

The 2D browser page remains the launch and recovery surface. Switching into or out of WebXR MUST NOT restart the application or recalculate the circuit unless the visitor changes the circuit or enters a measurement step under the existing resampling rules.

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

After loading a preset, the preset pull-down keeps the selected preset visible so visitors can tell which demonstration circuit is active.

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

Stream Deck can currently trigger core actions by sending keyboard shortcuts and a mouse-button action. Direct Stream Deck SDK integration is not implemented yet.

Implemented keyboard mappings:

- previous step: `ArrowLeft`
- mouse left click: Stream Deck mouse-button left click action
- next step: `ArrowRight`
- reset execution: `R` or `Home`
- toggle circuit editor panel: `E`
- add selected gate: `+` or numpad `+`
- activate hovered button or selector: `Space`
- top Bloch view: `T`
- rotate Bloch view while held: `C` plus mouse movement
- restore Bloch view: `V`
- zoom Bloch view while held: `Z` plus vertical mouse movement
- bottom Bloch view: `B`

Loading a preset releases focus from the preset pull-down so arrow-key step controls work immediately after selection.

The repository includes `scripts/generate-streamdeck-mk2.mjs`, exposed as:

```sh
npm run streamdeck:mk2
```

It generates SVG key images, a `keymap.json` guide, and an importable `Bloch Stereo MK2.streamDeckProfile` under `streamdeck/mk2/`.

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

### Application Version Update

The Bloch Stereo application version is defined by the top-level `version` field in
`package.json`. Vite exposes this value as `__APP_VERSION__`, and the startup screen
displays it as `Version x.y.z`. The `Version: 0.7` value at the top of this document is
the specification revision and is independent of the application version.

Use npm to update the application version so that `package.json` and
`package-lock.json` remain synchronized. For example, to update the application to
version `1.0.2`, run:

```sh
npm version 1.0.2 --no-git-tag-version
```

Use semantic versioning when selecting the new value:

- patch (`1.0.1` → `1.0.2`) for backward-compatible fixes
- minor (`1.0.1` → `1.1.0`) for backward-compatible features
- major (`1.0.1` → `2.0.0`) for incompatible changes

After updating the version, verify the synchronized files and the production build:

```sh
npm pkg get version
git diff -- package.json package-lock.json
npm run typecheck
npm test
npm run build
```

Commit both `package.json` and `package-lock.json`. For a GitHub Pages production
release, merge the version commit into `main`, then create and push a matching
`v`-prefixed tag such as `v1.0.2`. See `doc/github-pages.md` for the complete release
procedure.

### Deployment Base Path

The production build reads the `BASE_PATH` environment variable and passes it to Vite's `base` setting. Use it when the generated `dist/` directory will be served below a web-server subdirectory instead of the domain root.

For example, when the application will be available at `https://example.org/exhibits/bloch-stereo/`, build it with:

```sh
BASE_PATH=/exhibits/bloch-stereo/ npm run build
```

The leading and trailing `/` are recommended for a server-root-relative deployment path. The generated asset URLs will then use `/exhibits/bloch-stereo/` as their base.

To generate location-independent relative asset URLs, use `./`:

```sh
BASE_PATH=./ npm run build
```

If `BASE_PATH` is omitted, the default is `/`, which assumes deployment at the domain root:

```sh
npm run build
```

In PowerShell, set the same environment variable before running the build:

```powershell
$env:BASE_PATH="/exhibits/bloch-stereo/"
npm run build
```

### Visual Canvas Verification

The Playwright script checks that the WebGL canvas renders nonblank desktop and mobile screenshots.

Run:

```sh
npx playwright install chromium
node scripts/verify-canvas.mjs
```

### WebXR Verification

Automated desktop checks SHOULD cover:

- capability probe states: absent, supported, unsupported, and rejected
- session start/end cleanup and repeated entry
- command mapping and one-press/one-action debouncing
- closest-hit ray selection
- controller connect/disconnect
- reference-space reset handling
- preservation of execution state across XR entry and exit
- desktop/anaglyph rendering after the animation-loop migration
- red/cyan anaglyph toggle and calibration behavior before and after an XR session

The Meta Immersive Web Emulator or IWER MAY be used for headset, controller, and hand-input regression tests on desktop Chromium. Emulation does not replace the physical Quest 3S acceptance pass because frame timing, optical readability, tracking comfort, browser lifecycle behavior, and thermal performance require the target headset.

---

## Performance Targets

The system should maintain:

- 60 FPS in 2D mode
- at least 45 FPS in stereo mode
- stable 72 FPS in Meta Quest 3S WebXR mode

for:

- 1 to 8 qubits
- up to approximately 200 gates

Performance guidance:

- avoid recreating geometries every animation frame
- keep exact simulation separate from visualization interpolation
- avoid unnecessary React rerenders in the render loop
- keep object allocation out of hot frame paths where practical

For Quest, the 72 FPS frame budget is approximately `13.9 ms`. Frame-time measurements SHOULD separate simulation/update CPU time from render CPU/GPU pressure. Acceptance testing uses the heaviest supported three-sphere exhibit presets, not an empty scene.

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
- passthrough mixed reality after the `immersive-vr` milestone
- direct in-XR circuit and QASM editing
- advanced WebXR features such as anchors, room meshing, and multi-user colocated sessions
- quantum error correction visualization

---

## WebXR References

The Quest plan is based on the following primary or project-maintainer references. Browser capabilities MUST still be probed at runtime because optional WebXR modules may change independently of this specification.

- [W3C WebXR Device API](https://www.w3.org/TR/webxr/)
- [Three.js WebXRManager](https://threejs.org/docs/pages/WebXRManager.html)
- [Three.js VR content guide](https://threejs.org/manual/en/how-to-create-vr-content.html)
- [Three.js VRButton](https://threejs.org/docs/pages/VRButton.html)
- [Meta Immersive Web Emulation Runtime](https://meta-quest.github.io/immersive-web-emulation-runtime/)
- [Meta Quest performance frame budgets](https://developers.meta.com/horizon/documentation/unreal/po-perf-opt-mobile/)

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
8. enter and leave an immersive Meta Quest 3S presentation without losing circuit state
9. inspect and step through the core educational presets in VR using either Touch Plus controller

The project is not judged primarily by:

- simulator scale
- benchmark performance
- feature count
- production quantum SDK completeness
