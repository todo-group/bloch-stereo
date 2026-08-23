<p align="center">
  <img src="doc/bloch-stereo-logo.svg" alt="Bloch Stereo logo" width="96" height="96">
</p>

# Bloch Stereo

[English](README.md) | [日本語](README-ja.md)

[![CI](https://img.shields.io/github/actions/workflow/status/todo-group/bloch-stereo/ci.yml?branch=main&label=CI)](https://github.com/todo-group/bloch-stereo/actions/workflows/ci.yml)
![Author](https://img.shields.io/badge/author-Synge%20Todo-0A7E8C)
[![npm >=10.9](https://img.shields.io/badge/npm-%3E%3D10.9-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![three.js](https://img.shields.io/npm/v/three?label=three.js&logo=threedotjs&logoColor=white)](https://www.npmjs.com/package/three)
[![React](https://img.shields.io/npm/v/react?label=react&logo=react)](https://www.npmjs.com/package/react)
[![Vite](https://img.shields.io/npm/v/vite?label=vite&logo=vite)](https://www.npmjs.com/package/vite)

Bloch Stereo is a browser-based quantum-circuit editor and stereoscopic Bloch-sphere visualizer for education, demonstrations, and science exhibitions.

It helps users follow quantum-state evolution, reduced single-qubit states, purity, correlations, measurement collapse, and quantum teleportation in small circuits.

## Features

- Separate **Bloch View** and **Circuit Editor** modes
- A startup screen that enters immersive VR when available, or red/cyan anaglyph stereo otherwise
- Standard 2D, red/cyan anaglyph stereo, and immersive WebXR presentation
- One to three Bloch spheres, automatically matched to the circuit's qubit count
- Purity for each displayed qubit and a connected correlation matrix for two- and three-qubit circuits
- Step controls: Prev, Auto/Pause, Next, Reset, and Loop
- Top, View, and Bottom camera presets, pointer-drag rotation, and zoom
- Smooth Bloch-vector animation between exact execution steps
- A circuit timeline that highlights the current gate in orange and scrolls with long circuits
- A 2D circuit editor for single-qubit gates, controlled gates, noise channels, and measurement
- OpenQASM import/export and reusable user-defined presets
- Random measurement outcomes with consistent collapse and classical-register updates
- Meta Quest WebXR controls, circuit display, purity display, and correlation-pair selection
- Touch Plus interaction with either controller: trigger-drag rotation and thumbstick zoom

## Running

Open [https://todo-group.github.io/bloch-stereo/](https://todo-group.github.io/bloch-stereo/) in a browser. No installation is required.

1. Select **Enter** on the startup screen.
2. On a supported VR headset, Bloch Stereo enters immersive VR. Otherwise, it opens in red/cyan anaglyph stereo mode.
3. Use **VR/Stereo** and **2D** to change the presentation, or select **Circuit Editor** to edit the circuit.

Red/cyan glasses are required for the anaglyph depth effect. Without glasses, select **2D**.

### Tested environments

| Environment | Verified functions |
| --- | --- |
| macOS with Google Chrome | Startup, 2D view, red/cyan anaglyph view, and Circuit Editor |
| Meta Quest 3S with Meta Quest Browser | Startup, immersive WebXR view, and Touch Plus controller operation |

### Other environments expected to work

The following environments are expected to work but have not been verified by this project.

| Use | Expected environments |
| --- | --- |
| 2D and anaglyph | Current Chrome, Firefox, or Safari on macOS; current Chrome, Edge, or Firefox on Windows; current Chrome or Firefox on Linux; current Chrome on Android |
| Standalone VR | Meta Quest 2, Meta Quest 3, and Meta Quest Pro with Meta Quest Browser; PICO 4-series headsets with a browser that supports WebXR `immersive-vr` |
| PC VR | Chrome or Edge on a system that exposes a connected OpenXR headset—such as Meta Quest Link, HTC Vive, or Valve Index—to WebXR |

2D and anaglyph modes require WebGL. Immersive VR additionally requires an HTTPS page and a browser/device combination for which WebXR reports `immersive-vr` support. Browser and headset updates may affect availability.

## Presets

The Circuit Editor includes:

- `|0>`, `|00>`, and `|000>` initial states
- Bell state
- Product mixed state `I/2 x I/2`
- GHZ state
- H-CZ measurement circuit
- Random two-qubit states followed by SWAP
- Quantum teleportation with a random input state
- User-defined presets saved with **SAVE**

Bell, `I/2 x I/2`, and GHZ include measurement of every qubit at the end. Random Swap and Quantum Teleportation generate fresh random input states when selected and at the start of every Loop cycle.

## Bloch View

Bloch View is dedicated to circuit-execution visualization.

- A one-qubit circuit displays `q0`; a two-qubit circuit displays `q0` and `q1`; a three-qubit circuit displays `q0`, `q1`, and `q2`.
- Two- and three-qubit circuits display a connected correlation matrix. For three qubits, select `q0/q1`, `q0/q2`, or `q1/q2`.
- Each Bloch sphere displays its qubit label and purity.
- Short circuits are shown in full. Long circuits scroll to keep the current gate visible.
- In immersive VR, controls and circuit information appear as fixed spatial panels. They do not rotate with the Bloch spheres.

## Circuit Editor

The Circuit Editor provides a flat 2D workspace with:

- single-qubit gates: `H`, `X`, `Y`, `Z`, `S`, `S+`, `T`, `T+`, `RX`, `RY`, and `RZ`
- two-qubit gates: `CX` and `CZ`
- depolarizing, dephasing, and amplitude-damping noise channels
- measurement, target/control selection, gate addition, and gate deletion
- rotation-angle and noise-probability inputs
- OpenQASM import/export
- eye separation and focus settings, plus red/cyan gain settings where applicable
- **SAVE** for adding the current circuit to the preset list

## License

[MIT License](LICENSE)
