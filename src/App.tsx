import { useEffect } from "react";
import { CircleDot, Eye, Pause, Play, RotateCcw, SkipBack, SkipForward, Wand2 } from "lucide-react";
import { CircuitEditor } from "./circuit/editor/CircuitEditor";
import { CorrelationMatrixStereo } from "./stereo/CorrelationMatrixStereo";
import { BlochSphereStereo } from "./stereo/BlochSphereStereo";
import { useAppStore } from "./store/useAppStore";
import { blochVectorsForState, correlationMatrix } from "./circuit/simulator/density";

export function App() {
  const {
    circuit,
    snapshots,
    currentStep,
    autoplay,
    displayMode,
    nextStep,
    previousStep,
    resetExecution,
    toggleAutoplay,
    setDisplayMode,
    loadTeleportation,
  } = useAppStore();
  const snapshot = snapshots[currentStep] ?? snapshots[0];
  const blochVectors = blochVectorsForState(snapshot.statevector, circuit.numQubits);
  const correlations =
    circuit.numQubits >= 2 ? correlationMatrix(snapshot.statevector, circuit.numQubits, 0, 1) : undefined;

  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = window.setInterval(() => nextStep(), 700);
    return () => window.clearInterval(timer);
  }, [autoplay, nextStep]);

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
          <button type="button" onClick={loadTeleportation} title="Load teleportation preset">
            <Wand2 aria-hidden="true" />
            Teleport
          </button>
        </div>
        <div className="step-counter">
          <span>{currentStep}</span>
          <small>/ {Math.max(0, snapshots.length - 1)}</small>
        </div>
      </header>

      <section className="workspace">
        <CircuitEditor />
        <section className="visual-stage" aria-label="Bloch visualization">
          <BlochSphereStereo vectors={blochVectors} displayMode={displayMode} activeStep={currentStep} />
          <div className="visual-readouts">
            <div className="state-strip">
              {snapshot.classicalBits.map((bit, index) => (
                <span key={index}>
                  c{index}: {bit}
                </span>
              ))}
            </div>
            {correlations ? <CorrelationMatrixStereo matrix={correlations} displayMode={displayMode} /> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
