<p align="center">
  <img src="doc/bloch-stereo-logo.svg" alt="Bloch Stereo logo" width="96" height="96">
</p>

# Bloch Stereo Quantum Circuit Editor

[English](README.md) | [日本語](README-ja.md)

[![CI](https://img.shields.io/github/actions/workflow/status/todo-group/bloch-stereo/ci.yml?branch=main&label=CI)](https://github.com/todo-group/bloch-stereo/actions/workflows/ci.yml)
![Author](https://img.shields.io/badge/author-Synge%20Todo-0A7E8C)
[![npm >=10.9](https://img.shields.io/badge/npm-%3E%3D10.9-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![three.js](https://img.shields.io/npm/v/three?label=three.js&logo=threedotjs&logoColor=white)](https://www.npmjs.com/package/three)
[![React](https://img.shields.io/npm/v/react?label=react&logo=react)](https://www.npmjs.com/package/react)
[![Vite](https://img.shields.io/npm/v/vite?label=vite&logo=vite)](https://www.npmjs.com/package/vite)

Bloch Stereo is a browser-based quantum circuit editor and stereoscopic Bloch-sphere visualizer for education, demonstrations, and science exhibitions.

It focuses on small circuits where reduced density matrices, measurement collapse, connected correlations, and quantum teleportation can be understood visually.

## Features

- OpenQASM 2.0 import/export
- Step-by-step circuit execution with previous, next, reset, autoplay, and arrow-key navigation
- Stream Deck-friendly controls: `ArrowLeft`, `S`, `ArrowRight`, `R`/`Home`, `E`, `+`, `T`, `C`, `V`, `Z`, and `B`
- Density-matrix simulation backend by default, with a statevector backend still available in the simulator API
- Density-matrix noise channels: `depolarize(p)`, `dephase(p)`, and `ampdamp(p)`
- Smooth Bloch-vector animation from reduced single-qubit density matrices
- Selectable Bloch-sphere display for one to three qubits
- Selectable two-qubit connected correlation matrix
- Random measurement sampling when entering measurement steps, while preserving earlier measurement outcomes
- Red/cyan anaglyph stereo mode with eye separation, focus, red gain, and cyan gain controls
- Bloch view reset button that restores the camera with `|0>` upward
- QASM editor modal opened from the circuit editor
- Hide/show button for the left circuit editor panel
- Meta Quest 3S immersive WebXR presentation with Touch Plus controller rays and optional hand pinch input
- In-VR transport, recenter, preset, visible-qubit, and correlation-pair controls
- Existing red/cyan glasses mode remains available independently of WebXR

## Presets

The preset pull-down currently includes:

- `|0>`
- `|00>`
- `|000>`
- Bell state generation
- Product mixed state `I/2 x I/2`
- GHZ state generation
- H-CZ measurement circuit
- Random two-qubit state followed by SWAP decomposed into three `cx` gates
- Quantum teleportation with a random Alice input state

Choosing the teleportation or random-swap preset again generates a fresh random input state.

## Circuit Editor

The editor supports:

- gate palette
- target qubit selector
- control qubit selector only for controlled/two-qubit gates
- degree input for `rx`, `ry`, and `rz`
- probability input for noise channels
- append selected gate
- delete existing gates
- timeline step selection with automatic horizontal scrolling
- QASM import/export through the modal editor

Displayed gate buttons include `H`, `X`, `Y`, `Z`, `S`, `S+`, `T`, `T+`, `RX`, `RY`, `RZ`, `CX`, `CZ`, `DEP`, `PHASE`, `DAMP`, and measurement. `S+` and `T+` are exported as standard OpenQASM `sdg` and `tdg`.

The parser and simulator also support `id` and `swap`. The SWAP button is intentionally not shown in the palette; the random-swap preset uses the three-`cx` decomposition.

## Stream Deck

Core actions can be triggered by configuring Stream Deck buttons to send keyboard shortcuts:

- previous step: `ArrowLeft`
- toggle stereo mode: `S`
- next step: `ArrowRight`
- reset execution: `R` or `Home`
- toggle circuit editor panel: `E`
- add selected gate: `+` or numpad `+`
- activate the hovered button or selector: `Space`
- top Bloch view: `T`
- rotate Bloch view while held: `C` + mouse move
- restore Bloch view: `V`
- zoom Bloch view while held: `Z` + vertical mouse move
- bottom Bloch view: `B`

Direct Stream Deck SDK integration is still future work.

Generate MK.2 key icons, a keymap file, and an importable Stream Deck profile:

```sh
npm run streamdeck:mk2
```

The generated assets are written to `streamdeck/mk2/`, including `Bloch Stereo MK2.streamDeckProfile` for direct import.

## Visualization

Each Bloch sphere plots the selected qubit's reduced density matrix. Entangled qubits therefore appear as mixed states with shortened Bloch vectors.

For a selected qubit pair, the 3x3 matrix displays connected correlations:

```txt
C_ab = <sigma_a tensor sigma_b> - <sigma_a><sigma_b>
```

Product states display as the zero matrix.

## OpenQASM Support

Supported OpenQASM scope:

- one quantum register
- one classical register
- `id`, `x`, `y`, `z`, `h`, `s`, `sdg`, `t`, `tdg`
- `rx(theta)`, `ry(theta)`, `rz(theta)`
- app-specific noise extensions: `depolarize(p)`, `dephase(p)`, `ampdamp(p)`
- `cx`, `cz`, `swap`
- `measure q[i] -> c[j]`
- `if (c==n)` conditions over the full little-endian classical register value

The simulator is designed for educational circuits of roughly 1 to 8 qubits and up to about 200 gates.

## Running

Requirements:

- Node.js 20 or later
- npm
- A WebGL-capable browser

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Open the URL printed by Vite, usually:

```txt
http://localhost:5173/
```

Run tests:

```sh
npm run test
```

Build:

```sh
npm run build
```

Optional canvas verification:

```sh
npx playwright install chromium
node scripts/verify-canvas.mjs
```

## Meta Quest 3S

Serve the production build over HTTPS, open it in the current Meta Quest Browser, and select **Enter VR**. The immersive view uses native headset stereo; the existing red/cyan anaglyph mode remains available on ordinary displays.

The initial immersive interface supports playback and visualization. Circuit construction and QASM text editing remain in the 2D browser page.

Desktop WebXR emulation is available during development at:

```txt
http://localhost:5173/?emulate-xr=1
```

After starting the development server, run the IWER regression with:

```sh
npm run verify:webxr
```

## Project Structure

```txt
src/
  circuit/
    editor/
    qasm2/
    simulator/
    types.ts
  presets/
  stereo/
  store/
  styles/
scripts/
  generate-streamdeck-mk2.mjs
  verify-canvas.mjs
streamdeck/
  mk2/
doc/
  spec.md
```

## Roadmap

Possible future work:

- full density-matrix UI
- OpenQASM 3
- Stream Deck hardware integration
- passthrough mixed reality and full in-XR circuit editing
- GPU acceleration
- tensor-network backend

## License

[MIT License](LICENSE)
