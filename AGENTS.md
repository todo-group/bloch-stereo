# AGENTS.md
Guidelines for AI coding agents working on the Bloch Stereo Quantum Circuit Editor project.
This document defines:
- project goals
- architectural constraints
- coding conventions
- rendering philosophy
- interaction philosophy
- implementation priorities
Agents MUST read and follow this document before making modifications.
---
# Project Philosophy
This project is not merely a quantum circuit editor.
The goal is to create a visually intuitive stereoscopic environment for understanding:
- quantum states
- Bloch vectors
- entanglement
- reduced density matrices
- quantum teleportation
- measurement collapse
The system is intended primarily for:
- science exhibitions
- public demonstrations
- education
- interactive exploration
Visual clarity and intuitive understanding are more important than maximum simulation performance.
---
# Core Principles
## 1. Smooth Visual Continuity
Quantum states SHOULD appear visually continuous.
Bloch vectors MUST animate smoothly between execution steps.
Avoid:
- sudden jumps
- flickering
- unstable camera movement
- abrupt UI changes
---
# 2. Stereoscopic Readability
The renderer MUST remain readable in:
- red-green anaglyph stereo mode
- standard 2D mode
Do not use color combinations that break stereo readability.
---
# 3. Exhibition Robustness
The system is designed for public interactive use.
Prioritize:
- stability
- simplicity
- recoverability
- low cognitive load
Avoid:
- modal UI complexity
- fragile workflows
- hidden controls
---
# 4. Physical Interaction Feel
The interaction model should feel physical.
Camera movement SHOULD feel:
- smooth
- inertial
- tangible
Bloch spheres SHOULD resemble:
- transparent globes
- physical instruments
- museum exhibits
---
# 5. Real-Time Responsiveness
The system SHOULD maintain:
- 60 FPS in 2D mode
- ≥ 45 FPS in stereo mode
for:
- ≤ 8 qubits
- ≤ 200 gates
Avoid unnecessary allocations during rendering.
---
# Target Hardware
## Pointing Device
Primary pointing device:
- Elecom HUGE PLUS trackball
The UI MUST work well with:
- low cursor precision
- low cursor travel
- continuous camera rotation
Large interaction targets are preferred.
---
# Macro Device
Supported macro controller:
- Elgato Stream Deck MK.2
Common actions SHOULD be accessible from Stream Deck.
---
# Display Modes
The renderer MUST support:
1. standard 2D mode
2. red-green anaglyph stereo mode
Switching modes MUST NOT require restart.
---
# Architectural Principles
# Rendering and Simulation Separation
Simulation MUST remain discrete and exact.
Visualization MAY interpolate visually between exact states.
Example:
```txt
simulation:
  exact step k
  exact step k+1
visualization:
  interpolated display state

Never modify the exact simulator state for visual purposes.

⸻

State Management

Keep simulation state immutable whenever possible.

Recommended separation:

Circuit
ExecutionState
VisualizationState
UIState

Avoid tightly coupling rendering logic to simulator internals.

⸻

Module Boundaries

Preferred architecture:

circuit/
  editor
  parser
  exporter
simulator/
  statevector
  gates
  measurement
  density matrices
stereo/
  rendering
  Bloch spheres
  correlation matrices
  camera system

⸻

Quantum Simulation Guidelines

Initial Scope

The simulator targets:

* pure states
* 1–8 qubits
* educational visualization

Do NOT prematurely optimize for:

* large-scale simulation
* distributed execution
* HPC workloads

Correctness and clarity are more important.

⸻

Measurement Handling

Measurement MUST:

* compute probabilities
* collapse the exact state
* update classical registers

Visualization MAY animate collapse smoothly.

⸻

Reduced Density Matrices

Reduced density matrices are central to the project.

The implementation SHOULD prioritize:

* correctness
* numerical stability
* interpretability

⸻

Rendering Guidelines

Bloch Sphere Appearance

Bloch spheres SHOULD resemble:

* transparent scientific globes
* museum exhibit objects

Required:

* latitude lines
* longitude lines
* semi-transparent grid rendering

Avoid:

* cluttered shading
* excessive decoration
* noisy textures

⸻

Camera Movement

Camera motion SHOULD:

* feel smooth
* avoid jitter
* avoid excessive acceleration

Preferred:

* damped interpolation
* inertial movement

⸻

Stereo Rendering

Stereo mode MUST preserve:

* readability
* depth perception
* viewer comfort

Avoid:

* excessive eye separation
* aggressive parallax
* saturated conflicting colors

⸻

Color Philosophy

2D Mode

Use:

* vivid colors
* visually distinct gates
* bright vectors

⸻

Stereo Mode

Prioritize:

* depth readability
* contrast stability
* reduced eye strain

The renderer MAY automatically reduce saturation in stereo mode.

⸻

UI Philosophy

Minimal Cognitive Load

The UI should remain understandable at a glance.

Prioritize:

* large buttons
* direct manipulation
* obvious controls

Avoid:

* deeply nested menus
* tiny icons
* hidden gestures

⸻

Step Execution

The following actions MUST always be easily accessible:

* next step
* previous step
* reset
* autoplay
* stereo toggle

⸻

Animation Guidelines

Smooth Interpolation

Bloch vectors SHOULD interpolate using smooth easing.

Preferred easing:

smoothstep
easeInOutCubic

Avoid:

* linear robotic motion
* discontinuous jumps

⸻

Gate-Aware Animation

Future implementations MAY animate:

* rx
* ry
* rz

as true Bloch-sphere rotations.

Initial implementations MAY use vector interpolation.

⸻

Code Style

Language

Use:

* TypeScript
* strict typing

Avoid:

* implicit any
* large untyped objects

⸻

React Guidelines

Prefer:

* functional components
* hooks
* composable rendering components

Avoid:

* monolithic components
* deep prop drilling

⸻

Naming Conventions

Use descriptive names.

Preferred:

BlochSphereRenderer
CorrelationMatrixView
ExecutionTimeline

Avoid vague names like:

Thing
Manager
Utils
Helper

⸻

Rendering Performance

Avoid:

* recreating geometries every frame
* excessive object allocation
* unnecessary React re-renders

Prefer:

* memoization
* reusable buffers
* stable references

⸻

Numerical Stability

Use tolerances for floating-point comparisons.

Avoid assuming exact equality for:

* amplitudes
* density matrices
* probabilities

⸻

Recommended Libraries

Rendering

* Three.js

⸻

State Management

* Zustand

⸻

Build System

* Vite

⸻

Recommended Future Extensions

Potential future additions:

* OpenQASM 3
* GPU acceleration
* tensor-network backend
* WebXR support
* quantum error correction visualization

Agents SHOULD avoid designing current architecture in ways that block these future directions.

⸻

Non-Goals

This project is NOT primarily intended to be:

* a production quantum SDK
* a cloud quantum platform
* a high-performance simulator
* a hardware compiler stack

Avoid introducing unnecessary enterprise complexity.

⸻

Pull Request Guidelines

Changes SHOULD:

* preserve visual smoothness
* preserve stereo readability
* preserve interaction simplicity

Large architectural changes SHOULD include:

* rationale
* performance considerations
* stereo-mode considerations

⸻

Testing Priorities

Highest-priority test targets:

1. OpenQASM parsing
2. statevector correctness
3. reduced density matrices
4. measurement collapse
5. animation continuity
6. stereo rendering stability

⸻

Success Criteria

The project is successful if users can:

* intuitively understand Bloch vectors
* visually grasp entanglement
* follow teleportation step-by-step
* interact fluidly without instructions
* comfortably use stereoscopic mode

The project is NOT judged primarily by:

* simulator scale
* benchmark performance
* feature count


