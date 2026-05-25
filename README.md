# Bloch Stereo Quantum Circuit Editor

[English](README.md) | [日本語](README-ja.md)

Interactive stereoscopic visualization environment for quantum circuits, Bloch spheres, reduced density matrices, and entanglement.
Designed for:
- science exhibitions
- education
- interactive demonstrations
- quantum information visualization
---
# Features
- OpenQASM 2.0 import/export
- lightweight circuit editor
- step-by-step execution
- animated Bloch-sphere visualization
- reduced density matrix visualization
- two-qubit correlation visualization
- quantum teleportation demonstration
- stereoscopic red-green rendering
- Stream Deck integration
- trackball-oriented interaction
---
# Screenshot
```txt
[ Circuit Editor ]     [ Stereo Bloch Visualization ]
q0 ──H────●────────
          │
q1 ───────X────M───
             ◉
         ↗
      Bloch Sphere
```

⸻

Design Goals

This project aims to make quantum information visually intuitive.

The core philosophy is:

* quantum states should move smoothly
* entanglement should be visible
* teleportation should be understandable
* interaction should feel physical
* stereoscopic depth should enhance intuition

⸻

Supported Visualizations

Single-Qubit View

* stereoscopic Bloch sphere
* animated Bloch vector
* purity indication
* optional trajectory history

⸻

Two-Qubit View

* two Bloch spheres
* reduced density matrices
* 3×3 correlation matrix
* entanglement visualization

⸻

Quantum Teleportation

Includes a built-in teleportation preset with:

* Bell-pair generation
* measurement visualization
* classical communication
* correction operations
* reconstructed state visualization

⸻

Display Modes

Standard 2D Mode

* colorful rendering
* bright UI
* vivid Bloch vectors

⸻

Red-Green Stereo Mode

Supports red-green anaglyph stereoscopic rendering.

Recommended glasses:

* red-green
    or
* red-cyan

Features:

* adjustable stereo separation
* depth-enhanced Bloch spheres
* stereoscopic entanglement visualization

⸻

Recommended Hardware

Right Hand

Recommended pointing device:

* Elecom HUGE PLUS trackball

Designed for:

* smooth camera control
* low cursor travel
* exhibition robustness

⸻

Left Hand

Recommended macro controller:

* Elgato Stream Deck MK.2 (15-key)

Default mappings include:

* execution control
* gate insertion
* stereo toggle
* teleportation preset
* reset
* autoplay

⸻

Technology Stack

* TypeScript
* React
* Vite
* Three.js
* WebGL
* Zustand

⸻

OpenQASM Support

Currently supported:

* OpenQASM 2.0

Supported operations:

* single-qubit gates
* two-qubit gates
* measurement
* conditional execution

⸻

Installation and Running

Requirements

* Node.js 20 or later
* npm, included with Node.js
* A modern WebGL-capable browser such as Chrome, Edge, Firefox, or Safari

Check your environment:

```sh
node --version
npm --version
```

macOS

Install Node.js with Homebrew:

```sh
brew install node
```

Or install Node.js 20+ from:

```txt
https://nodejs.org/
```

Linux

Using NodeSource on Debian/Ubuntu:

```sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Using Fedora:

```sh
sudo dnf install nodejs npm
```

If your distribution provides an older Node.js, use `nvm` or the official Node.js packages and install Node.js 20+.

Windows

Install Node.js 20+ with winget in PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
```

Or download the Windows installer from:

```txt
https://nodejs.org/
```

After installation, open a new PowerShell window and verify:

```powershell
node --version
npm --version
```

Clone

```sh
git clone https://github.com/yourname/bloch-stereo.git
cd bloch-stereo
```

Install Dependencies

macOS / Linux:

```sh
npm install
```

Windows PowerShell:

```powershell
npm install
```

Development Server

macOS / Linux:

```sh
npm run dev
```

Windows PowerShell:

```powershell
npm run dev
```

Open the URL printed by Vite, usually:

```txt
http://localhost:5173/
```

Build

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

Optional visual verification:

```sh
npx playwright install chromium
node scripts/verify-canvas.mjs
```

⸻

Project Structure

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

Example OpenQASM

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

Animation

Bloch vectors move continuously between execution steps.

Features:

* smooth interpolation
* interruptible transitions
* autoplay support
* gate-aware animation (future)

⸻

Bloch Sphere Rendering

Bloch spheres include:

* latitude lines
* longitude lines
* semi-transparent globe rendering

The goal is to make the Bloch sphere resemble a physical transparent globe.

⸻

Performance Targets

Target performance:

* 60 FPS in 2D mode
* ≥ 45 FPS in stereo mode

Typical limits:

* ≤ 8 qubits
* ≤ 200 gates

⸻

Development Roadmap

Phase 1

* circuit rendering
* statevector simulation
* Bloch sphere rendering

Phase 2

* OpenQASM parser/exporter
* reduced density matrices
* step execution

Phase 3

* animated transitions
* teleportation visualization
* measurement visualization

Phase 4

* stereo optimization
* Stream Deck optimization
* exhibition hardening

⸻

Future Extensions

Possible future features:

* OpenQASM 3
* GPU acceleration
* tensor-network backend
* noise simulation
* WebXR support
* quantum error correction visualization

⸻

Philosophy

Quantum information is often mathematically elegant but visually inaccessible.

This project attempts to make:

* quantum states
* entanglement
* teleportation
* measurement collapse

feel spatial, continuous, and intuitive.

⸻

License

[MIT License](LICENSE)

⸻

Acknowledgements

Inspired by:

* Bloch sphere visualization tools
* quantum education software
* stereoscopic visualization systems
* interactive science museum exhibits
