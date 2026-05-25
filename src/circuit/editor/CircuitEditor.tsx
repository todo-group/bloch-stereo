import { Download, Plus, Upload } from "lucide-react";
import { CircuitCanvas } from "./CircuitCanvas";
import { GatePalette } from "./GatePalette";
import { useAppStore } from "../../store/useAppStore";

export function CircuitEditor() {
  const {
    circuit,
    qasmText,
    currentStep,
    targetQubit,
    controlQubit,
    forcedBranch,
    error,
    setQasmText,
    importQasm,
    exportCircuit,
    addGate,
    deleteGate,
    setStep,
    setTargetQubit,
    setControlQubit,
    setForcedBranch,
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
          <label>
            Branch
            <select value={forcedBranch} onChange={(event) => setForcedBranch(event.target.value as typeof forcedBranch)}>
              <option value="random">random</option>
              <option value="00">00</option>
              <option value="01">01</option>
              <option value="10">10</option>
              <option value="11">11</option>
            </select>
          </label>
          <button type="button" className="primary-action" onClick={addGate}>
            <Plus aria-hidden="true" />
            Add
          </button>
        </div>
      </div>

      <CircuitCanvas circuit={circuit} currentStep={currentStep} onStepSelect={setStep} onDeleteGate={deleteGate} />

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
          <span>
            {circuit.numQubits} qubits · {circuit.ops.length} gates
          </span>
        </div>
        <textarea value={qasmText} onChange={(event) => setQasmText(event.target.value)} spellCheck={false} />
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </section>
  );
}
