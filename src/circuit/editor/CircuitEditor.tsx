import { useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { CircuitCanvas } from "./CircuitCanvas";
import { GatePalette } from "./GatePalette";
import { useAppStore } from "../../store/useAppStore";
import type { GateName } from "../types";

export function CircuitEditor() {
  const [qasmOpen, setQasmOpen] = useState(false);
  const {
    circuit,
    qasmText,
    currentStep,
    selectedGate,
    rotationAngleDegrees,
    noiseProbability,
    targetQubit,
    controlQubit,
    error,
    setQasmText,
    importQasm,
    exportCircuit,
    addGate,
    deleteGate,
    setStep,
    setRotationAngleDegrees,
    setNoiseProbability,
    setTargetQubit,
    setControlQubit,
  } = useAppStore();

  return (
    <section className="editor-panel" aria-label="Circuit editor">
      <div className="editor-controls">
        <GatePalette />
        <div className="qubit-controls">
          <label>
            Target
            <select value={targetQubit} onChange={(event) => setTargetQubit(Number(event.target.value))}>
              {Array.from({ length: circuit.numQubits }, (_, qubit) => (
                <option key={qubit} value={qubit}>
                  q{qubit}
                </option>
              ))}
            </select>
          </label>
          {usesControlQubit(selectedGate) ? (
            <label>
              Control
              <select value={controlQubit} onChange={(event) => setControlQubit(Number(event.target.value))}>
                {Array.from({ length: circuit.numQubits }, (_, qubit) => (
                  <option key={qubit} value={qubit}>
                    q{qubit}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {isRotationGate(selectedGate) ? (
            <label>
              Angle
              <input
                type="number"
                min="-360"
                max="360"
                step="15"
                value={rotationAngleDegrees}
                onChange={(event) => setRotationAngleDegrees(Number(event.currentTarget.value))}
                aria-label="Rotation angle in degrees"
              />
            </label>
          ) : null}
          {isNoiseGate(selectedGate) ? (
            <label>
              P
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={noiseProbability}
                onChange={(event) => setNoiseProbability(Number(event.currentTarget.value))}
                aria-label="Noise probability"
              />
            </label>
          ) : null}
          <button type="button" className="primary-action" onClick={addGate}>
            <Plus aria-hidden="true" />
            Add
          </button>
          <button type="button" onClick={() => setQasmOpen(true)}>
            QASM
          </button>
        </div>
      </div>

      <CircuitCanvas circuit={circuit} currentStep={currentStep} onStepSelect={setStep} onDeleteGate={deleteGate} />

      <div className="circuit-summary">
        {circuit.numQubits} qubits · {circuit.ops.length} gates
        {error ? <p className="error-text">{error}</p> : null}
      </div>

      {qasmOpen ? (
        <div className="qasm-overlay" role="dialog" aria-modal="true" aria-label="QASM editor">
          <div className="qasm-panel">
            <div className="qasm-actions">
              <button type="button" onClick={importQasm}>
                <Upload aria-hidden="true" />
                Import
              </button>
              <button type="button" onClick={exportCircuit}>
                <Download aria-hidden="true" />
                Export
              </button>
              <button type="button" onClick={() => setQasmOpen(false)}>
                Close
              </button>
              <span>
                {circuit.numQubits} qubits · {circuit.ops.length} gates
              </span>
            </div>
            <textarea value={qasmText} onChange={(event) => setQasmText(event.target.value)} spellCheck={false} />
            {error ? <p className="error-text">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function usesControlQubit(gate: GateName): boolean {
  return gate === "cx" || gate === "cz" || gate === "swap";
}

function isRotationGate(gate: GateName): boolean {
  return gate === "rx" || gate === "ry" || gate === "rz";
}

function isNoiseGate(gate: GateName): boolean {
  return gate === "depolarize" || gate === "dephase" || gate === "ampdamp";
}
