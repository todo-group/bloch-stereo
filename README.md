# Bloch Stereo Quantum Circuit Editor

[English](README.md) | [日本語](README-ja.md)

[![CI](https://github.com/wistaria/bloch-stereo/actions/workflows/ci.yml/badge.svg)](https://github.com/wistaria/bloch-stereo/actions/workflows/ci.yml)

Bloch Stereo is a browser-based quantum circuit editor and stereoscopic Bloch-sphere visualizer for education, demonstrations, and science exhibitions.

It focuses on small circuits where reduced density matrices, measurement collapse, connected correlations, and quantum teleportation can be understood visually.

## Features

- OpenQASM 2.0 import/export
- Step-by-step circuit execution with previous, next, reset, autoplay, and arrow-key navigation
- Density-matrix simulation backend by default, with a statevector backend still available in the simulator API
- Density-matrix noise channels: `depolarize(p)`, `dephase(p)`, and `ampdamp(p)`
- Smooth Bloch-vector animation from reduced single-qubit density matrices
- Selectable Bloch-sphere display for one to three qubits
- Selectable two-qubit connected correlation matrix
- Random measurement sampling when entering measurement steps, while preserving earlier measurement outcomes
- Red/cyan anaglyph stereo mode with eye separation, focus, red gain, and cyan gain controls
- Bloch view reset button that restores the camera with `|0>` upward
- QASM editor modal opened from the circuit editor

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
  verify-canvas.mjs
doc/
  spec.md
```

## Roadmap

Possible future work:

- full density-matrix UI
- OpenQASM 3
- Stream Deck hardware integration
- WebXR
- GPU acceleration
- tensor-network backend

## License

[MIT License](LICENSE)
