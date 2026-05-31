import { useEffect, useMemo, useState } from "react";
import { CircleDot, Eye, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { CircuitEditor } from "./circuit/editor/CircuitEditor";
import { CorrelationMatrixStereo } from "./stereo/CorrelationMatrixStereo";
import { BlochSphereStereo } from "./stereo/BlochSphereStereo";
import { useAppStore } from "./store/useAppStore";
import type { PresetName } from "./store/useAppStore";
import {
  blochVectorsForDensityMatrix,
  blochVectorsForState,
  correlationMatrix,
  correlationMatrixFromDensityMatrix,
} from "./circuit/simulator/density";

const presetOptions: Array<{ value: PresetName; label: string }> = [
  { value: "zero", label: "|0>" },
  { value: "zero-zero", label: "|00>" },
  { value: "zero-zero-zero", label: "|000>" },
  { value: "bell", label: "Bell state" },
  { value: "mixed-product", label: "I/2 x I/2" },
  { value: "ghz", label: "GHZ state" },
  { value: "h-cz-measure", label: "H-CZ measurement" },
  { value: "random-swap", label: "Random swap" },
  { value: "teleportation", label: "Quantum teleportation" },
];

export function App() {
  const {
    circuit,
    snapshots,
    currentStep,
    autoplay,
    displayMode,
    stereoSettings,
    nextStep,
    previousStep,
    resetExecution,
    toggleAutoplay,
    setDisplayMode,
    setStereoSettings,
    loadPreset,
  } = useAppStore();
  const [visibleQubits, setVisibleQubits] = useState<number[]>([0, 1, 2]);
  const [correlationPair, setCorrelationPair] = useState<[number, number]>([0, 1]);
  const snapshot = snapshots[currentStep] ?? snapshots[0];
  const allBlochVectors = snapshot.densityMatrix
    ? blochVectorsForDensityMatrix(snapshot.densityMatrix, circuit.numQubits)
    : blochVectorsForState(snapshot.statevector, circuit.numQubits);
  const normalizedVisibleQubits = useMemo(
    () => visibleQubits.filter((qubit) => qubit < circuit.numQubits).slice(0, 3),
    [visibleQubits, circuit.numQubits],
  );
  const effectiveVisibleQubits = normalizedVisibleQubits.length ? normalizedVisibleQubits : [0];
  const blochVectors = effectiveVisibleQubits.map((qubit) => allBlochVectors[qubit]);
  const validCorrelationPair: [number, number] =
    correlationPair[0] < circuit.numQubits && correlationPair[1] < circuit.numQubits && correlationPair[0] !== correlationPair[1]
      ? correlationPair
      : [0, Math.min(1, circuit.numQubits - 1)];
  const correlations =
    circuit.numQubits >= 2
      ? snapshot.densityMatrix
        ? correlationMatrixFromDensityMatrix(snapshot.densityMatrix, circuit.numQubits, validCorrelationPair[0], validCorrelationPair[1])
        : correlationMatrix(snapshot.statevector, circuit.numQubits, validCorrelationPair[0], validCorrelationPair[1])
      : undefined;

  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = window.setInterval(() => nextStep(), 700);
    return () => window.clearInterval(timer);
  }, [autoplay, nextStep]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousStep();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextStep();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextStep, previousStep]);

  const toggleVisibleQubit = (qubit: number) => {
    setVisibleQubits((current) => {
      if (current.includes(qubit)) {
        const next = current.filter((item) => item !== qubit);
        return next.length ? next : current;
      }
      return [...current, qubit].slice(-3);
    });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <CircleDot aria-hidden="true" />
          <div>
            <h1>Bloch Stereo</h1>
            <p>Quantum circuit editor</p>
          </div>
        </div>
        <div className="transport" aria-label="Execution controls">
          <button type="button" onClick={previousStep} title="Previous step">
            <SkipBack aria-hidden="true" />
            Prev
          </button>
          <button type="button" onClick={toggleAutoplay} title="Autoplay">
            {autoplay ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {autoplay ? "Pause" : "Auto"}
          </button>
          <button type="button" onClick={nextStep} title="Next step">
            <SkipForward aria-hidden="true" />
            Next
          </button>
          <button type="button" onClick={resetExecution} title="Reset execution">
            <RotateCcw aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            className={displayMode === "anaglyph-red-green" ? "is-active" : ""}
            onClick={() => setDisplayMode(displayMode === "2d" ? "anaglyph-red-green" : "2d")}
            title="Stereo toggle"
          >
            <Eye aria-hidden="true" />
            Stereo
          </button>
        </div>
        <div className="preset-controls" aria-label="Preset circuits">
          <label>
            Preset
            <select
              value=""
              onChange={(event) => {
                const preset = event.currentTarget.value as PresetName;
                if (preset) loadPreset(preset);
              }}
            >
              <option value="">Choose circuit</option>
              {presetOptions.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="stereo-controls" aria-label="Stereo calibration controls">
          <label>
            Eye
            <input
              type="range"
              min="0.04"
              max="0.3"
              step="0.01"
              value={stereoSettings.eyeSeparation}
              onChange={(event) => setStereoSettings({ eyeSeparation: Number(event.currentTarget.value) })}
            />
            <output>{stereoSettings.eyeSeparation.toFixed(2)}</output>
          </label>
          <label>
            Focus
            <input
              type="range"
              min="2.8"
              max="8"
              step="0.1"
              value={stereoSettings.convergenceDistance}
              onChange={(event) => setStereoSettings({ convergenceDistance: Number(event.currentTarget.value) })}
            />
            <output>{stereoSettings.convergenceDistance.toFixed(1)}</output>
          </label>
          <label>
            Red
            <input
              type="range"
              min="0.3"
              max="1.3"
              step="0.05"
              value={stereoSettings.redGain}
              onChange={(event) => setStereoSettings({ redGain: Number(event.currentTarget.value) })}
            />
            <output>{stereoSettings.redGain.toFixed(2)}</output>
          </label>
          <label>
            Cyan
            <input
              type="range"
              min="0.2"
              max="1.2"
              step="0.05"
              value={stereoSettings.cyanGain}
              onChange={(event) => setStereoSettings({ cyanGain: Number(event.currentTarget.value) })}
            />
            <output>{stereoSettings.cyanGain.toFixed(2)}</output>
          </label>
        </div>
        <div className="step-counter">
          <span>{currentStep}</span>
          <small>/ {Math.max(0, snapshots.length - 1)}</small>
        </div>
      </header>

      <section className="workspace">
        <CircuitEditor />
        <section className="visual-stage" aria-label="Bloch visualization">
          <BlochSphereStereo
            vectors={blochVectors}
            labels={effectiveVisibleQubits.map((qubit) => `q${qubit}`)}
            displayMode={displayMode}
            stereoSettings={stereoSettings}
            activeStep={currentStep}
          />
          <div className="visual-readouts">
            <div className="view-controls">
              <div>
                <span>Bloch spheres</span>
                <div className="toggle-row">
                  {Array.from({ length: circuit.numQubits }, (_, qubit) => (
                    <button
                      key={qubit}
                      type="button"
                      className={effectiveVisibleQubits.includes(qubit) ? "is-active" : ""}
                      onClick={() => toggleVisibleQubit(qubit)}
                    >
                      q{qubit}
                    </button>
                  ))}
                </div>
              </div>
              {circuit.numQubits >= 2 ? (
                <div>
                  <span>Correlation</span>
                  <div className="pair-controls">
                    <select
                      value={validCorrelationPair[0]}
                      onChange={(event) => {
                        const first = Number(event.currentTarget.value);
                        setCorrelationPair([first, first === validCorrelationPair[1] ? (first === 0 ? 1 : 0) : validCorrelationPair[1]]);
                      }}
                    >
                      {Array.from({ length: circuit.numQubits }, (_, qubit) => (
                        <option key={qubit} value={qubit}>
                          q{qubit}
                        </option>
                      ))}
                    </select>
                    <select
                      value={validCorrelationPair[1]}
                      onChange={(event) => {
                        const second = Number(event.currentTarget.value);
                        setCorrelationPair([second === validCorrelationPair[0] ? (second === 0 ? 1 : 0) : validCorrelationPair[0], second]);
                      }}
                    >
                      {Array.from({ length: circuit.numQubits }, (_, qubit) => (
                        <option key={qubit} value={qubit}>
                          q{qubit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="state-strip">
              {snapshot.classicalBits.map((bit, index) => (
                <span key={index}>
                  c{index}: {bit}
                </span>
              ))}
            </div>
            {correlations ? (
              <CorrelationMatrixStereo
                matrix={correlations}
                displayMode={displayMode}
                pairLabel={`q${validCorrelationPair[0]}/q${validCorrelationPair[1]}`}
              />
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
