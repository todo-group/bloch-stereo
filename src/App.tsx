import { useEffect, useMemo, useRef, useState } from "react";
import { CircleDot, Eye, LayoutGrid, Pause, Play, Repeat2, RotateCcw, Save, SkipBack, SkipForward, SlidersHorizontal } from "lucide-react";
import { CircuitCanvas } from "./circuit/editor/CircuitCanvas";
import { CircuitEditor } from "./circuit/editor/CircuitEditor";
import { CorrelationMatrixStereo } from "./stereo/CorrelationMatrixStereo";
import { BlochSphereStereo } from "./stereo/BlochSphereStereo";
import { useAppStore } from "./store/useAppStore";
import type { PresetName, UserPreset } from "./store/useAppStore";
import type { XrSupportState } from "./xr/XrCapability";
import type { DisplayMode, StereoSettings } from "./circuit/types";
import { blochVectorsForDensityMatrix, blochVectorsForState, correlationMatrix, correlationMatrixFromDensityMatrix } from "./circuit/simulator/density";

const builtInPresetOptions: Array<{ value: PresetName; label: string }> = [
  { value: "zero", label: "|0>" }, { value: "zero-zero", label: "|00>" }, { value: "zero-zero-zero", label: "|000>" },
  { value: "bell", label: "Bell state" }, { value: "mixed-product", label: "I/2 x I/2" }, { value: "ghz", label: "GHZ state" },
  { value: "h-cz-measure", label: "H-CZ measurement" }, { value: "random-swap", label: "Random swap" },
  { value: "teleportation", label: "Quantum teleportation" },
];

type AppScreen = "startup" | "visualization" | "editor";
type VisualizationMode = DisplayMode | "xr";
type HoverActivatableElement = HTMLButtonElement | HTMLSelectElement;

function activateHoveredControl(): boolean {
  const control = document.querySelector<HoverActivatableElement>("button:hover:not(:disabled), select:hover:not(:disabled)");
  if (!control) return false;
  if (control instanceof HTMLSelectElement) {
    control.focus();
    const showPicker = Reflect.get(control, "showPicker");
    if (typeof showPicker === "function") showPicker.call(control); else control.click();
  } else control.click();
  return true;
}

export function App() {
  const state = useAppStore();
  const {
    circuit, snapshots, currentStep, autoplay, displayMode, stereoSettings, selectedPreset, userPresets, correlationPair,
    nextStep, previousStep, resetExecution, toggleAutoplay, stopAutoplay, setStep, setDisplayMode, setStereoSettings,
    resetStereoSettings, loadPreset, saveUserPreset, addGate, setCorrelationPair,
  } = state;
  const [screen, setScreen] = useState<AppScreen>("startup");
  const [loop, setLoop] = useState(false);
  const [playIntroOrbit, setPlayIntroOrbit] = useState(false);
  const [xrSupport, setXrSupport] = useState<XrSupportState>("checking");
  const xrStarterRef = useRef<(introOrbit?: boolean) => Promise<boolean>>(async () => false);
  const lastVisualizationModeRef = useRef<VisualizationMode>("anaglyph-red-green");
  const snapshot = snapshots[currentStep] ?? snapshots[0];
  const allBlochVectors = snapshot.densityMatrix
    ? blochVectorsForDensityMatrix(snapshot.densityMatrix, circuit.numQubits)
    : blochVectorsForState(snapshot.statevector, circuit.numQubits);
  const effectiveVisibleQubits = useMemo(
    () => Array.from({ length: Math.min(3, circuit.numQubits) }, (_, qubit) => qubit),
    [circuit.numQubits],
  );
  const blochVectors = effectiveVisibleQubits.map((qubit) => allBlochVectors[qubit]);
  const validCorrelationPair: [number, number] =
    correlationPair[0] < circuit.numQubits && correlationPair[1] < circuit.numQubits && correlationPair[0] !== correlationPair[1]
      ? correlationPair : [0, Math.min(1, circuit.numQubits - 1)];
  const correlations = circuit.numQubits >= 2 && effectiveVisibleQubits.length >= 2
    ? snapshot.densityMatrix
      ? correlationMatrixFromDensityMatrix(snapshot.densityMatrix, circuit.numQubits, validCorrelationPair[0], validCorrelationPair[1])
      : correlationMatrix(snapshot.statevector, circuit.numQubits, validCorrelationPair[0], validCorrelationPair[1])
    : undefined;
  const isStereoMode = displayMode === "anaglyph-red-green";

  useEffect(() => {
    if (xrSupport === "unsupported") {
      setDisplayMode("anaglyph-red-green");
      if (lastVisualizationModeRef.current === "xr") lastVisualizationModeRef.current = "anaglyph-red-green";
    }
  }, [setDisplayMode, xrSupport]);

  useEffect(() => {
    if (!autoplay || snapshots.length <= 1) return undefined;
    const atEnd = currentStep >= snapshots.length - 1;
    if (atEnd && !loop) {
      stopAutoplay();
      return undefined;
    }
    const timer = window.setTimeout(() => {
      const current = useAppStore.getState();
      if (loop && current.currentStep >= current.snapshots.length - 1) current.restartLoopCycle();
      else {
        const willReachEnd = loop && current.currentStep + 1 >= current.snapshots.length - 1;
        current.nextStep();
        if (willReachEnd) useAppStore.setState({ autoplay: true });
      }
    }, atEnd ? 1400 : 700);
    return () => window.clearTimeout(timer);
  }, [autoplay, currentStep, loop, snapshots.length, stopAutoplay]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen === "startup") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      if (event.key === " " || event.code === "Space") { if (activateHoveredControl()) event.preventDefault(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); previousStep(); }
      else if (event.key === "ArrowRight") { event.preventDefault(); nextStep(); }
      else if (event.key === "r" || event.key === "R" || event.key === "Home") { event.preventDefault(); resetExecution(); }
      else if (event.key === "+" || event.code === "NumpadAdd") { event.preventDefault(); addGate(); }
      else if (event.key === "e" || event.key === "E") {
        event.preventDefault();
        if (screen === "editor") returnToBlochView(); else openEditor();
      }
      else if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (displayMode === "2d") selectAnaglyph(); else select2d();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addGate, displayMode, nextStep, previousStep, resetExecution, screen, setDisplayMode, stopAutoplay]);

  async function enterApplication() {
    let enteredXr = false;
    if (xrSupport === "supported") enteredXr = await activateVr(true);
    else selectAnaglyph();
    setPlayIntroOrbit(!enteredXr);
    setScreen("visualization");
  }

  const toggleLoop = () => {
    if (loop) {
      setLoop(false);
      stopAutoplay();
      return;
    }
    setLoop(true);
    const current = useAppStore.getState();
    if (current.currentStep >= current.snapshots.length - 1) current.restartLoopCycle();
    else if (!current.autoplay) current.toggleAutoplay();
  };

  function openEditor() {
    stopAutoplay();
    setLoop(false);
    setPlayIntroOrbit(false);
    setScreen("editor");
  }

  function returnToBlochView() {
    stopAutoplay();
    setLoop(false);
    setPlayIntroOrbit(false);
    setScreen("visualization");
    const previousMode = lastVisualizationModeRef.current;
    if (previousMode === "xr" && xrSupport === "supported") void activateVr();
    else setDisplayMode(previousMode === "xr" ? "anaglyph-red-green" : previousMode);
  }

  async function activateVr(introOrbit = false): Promise<boolean> {
    const entered = await xrStarterRef.current(introOrbit);
    if (entered) lastVisualizationModeRef.current = "xr";
    return entered;
  }

  function select2d() {
    lastVisualizationModeRef.current = "2d";
    setDisplayMode("2d");
  }

  function selectAnaglyph() {
    lastVisualizationModeRef.current = "anaglyph-red-green";
    setDisplayMode("anaglyph-red-green");
  }

  return (
    <main className={`app-shell screen-${screen}`}>
      {screen === "editor" ? (
        <>
          <header className="editor-topbar floating-panel">
            <Brand compact />
            <PresetSelector selectedPreset={selectedPreset} userPresets={userPresets} loadPreset={loadPreset} saveUserPreset={saveUserPreset} />
            <StereoCalibration isStereoMode={isStereoMode} xrSupport={xrSupport} stereoSettings={stereoSettings} setStereoSettings={setStereoSettings} resetStereoSettings={resetStereoSettings} />
            <button type="button" className="mode-switch primary-action" onClick={returnToBlochView}><Eye aria-hidden="true" />Bloch View</button>
          </header>
          <section className="editor-workspace"><CircuitEditor /></section>
        </>
      ) : null}
      <section className="visualization-screen" aria-label="Bloch visualization" aria-hidden={screen !== "visualization"} hidden={screen === "editor"}>
          <BlochSphereStereo
            circuit={circuit} vectors={blochVectors} labels={effectiveVisibleQubits.map((qubit) => `q${qubit}`)} qubitIndices={effectiveVisibleQubits}
            displayMode={displayMode} stereoSettings={stereoSettings} activeStep={currentStep} introOrbit={playIntroOrbit}
            correlationMatrix={correlations} correlationPair={validCorrelationPair}
            onXrSupportChange={setXrSupport} onXrStarterChange={(startXr) => { xrStarterRef.current = startXr; }}
            xrPanelState={{
              canPrevious: currentStep > 0,
              canNext: currentStep < snapshots.length - 1,
              canAutoplay: snapshots.length > 1,
              autoplay,
              loop,
            }}
            xrActions={{
              previousStep,
              nextStep,
              reset: resetExecution,
              toggleAutoplay,
              toggleLoop,
              stopAutoplay,
              show2d: select2d,
              openEditor,
              selectCorrelationPair: setCorrelationPair,
            }}
          />
          <div className="visual-brand floating-panel"><Brand compact /></div>
          <div className="visual-mode-controls floating-panel" aria-label="Display mode">
            <button type="button" className={displayMode !== "2d" ? "is-active" : ""} onClick={() => xrSupport === "supported" ? void activateVr() : selectAnaglyph()}><Eye aria-hidden="true" />{xrSupport === "supported" ? "VR" : "Stereo"}</button>
            <button type="button" className={displayMode === "2d" ? "is-active" : ""} onClick={select2d}>2D</button>
            <button type="button" onClick={openEditor}><SlidersHorizontal aria-hidden="true" />Circuit Editor</button>
          </div>
          <div className="visual-transport floating-panel" aria-label="Execution controls">
            <button type="button" onClick={previousStep} disabled={currentStep === 0} title="Previous step"><SkipBack aria-hidden="true" />Prev</button>
            <button type="button" onClick={toggleAutoplay} disabled={snapshots.length <= 1} title="Autoplay">{autoplay ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{autoplay ? "Pause" : "Auto"}</button>
            <button type="button" onClick={nextStep} disabled={currentStep >= snapshots.length - 1} title="Next step"><SkipForward aria-hidden="true" />Next</button>
            <button type="button" onClick={() => { setLoop(false); resetExecution(); }} title="Reset execution"><RotateCcw aria-hidden="true" />Reset</button>
            <button type="button" className={loop ? "is-active" : ""} onClick={toggleLoop} disabled={snapshots.length <= 1} title="Loop autoplay"><Repeat2 aria-hidden="true" />Loop</button>
            <span className="step-counter"><b>{currentStep}</b><small>/ {Math.max(0, snapshots.length - 1)}</small></span>
          </div>
          {correlations ? <div className="visual-correlation floating-panel">
            {circuit.numQubits === 3 ? <CorrelationPairSelector pair={validCorrelationPair} onChange={setCorrelationPair} /> : null}
            <CorrelationMatrixStereo matrix={correlations} displayMode={displayMode} pairLabel={`q${validCorrelationPair[0]}/q${validCorrelationPair[1]}`} />
          </div> : null}
          <div className="visual-circuit floating-panel">
            <div className="visual-circuit-heading"><span><LayoutGrid aria-hidden="true" />Quantum circuit</span><span>Gate {currentStep} / {circuit.ops.length}</span></div>
            <CircuitCanvas circuit={circuit} currentStep={currentStep} onStepSelect={setStep} readOnly compact />
          </div>
      </section>
      {screen === "startup" ? <StartupScreen onEnter={() => void enterApplication()} xrSupport={xrSupport} /> : null}
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "brand is-compact" : "brand"}><span className="brand-mark" aria-hidden="true"><CircleDot className="brand-mark-red" /><CircleDot className="brand-mark-cyan" /></span><div><h1>Bloch Stereo</h1>{compact ? null : <p>Quantum state visualization</p>}</div></div>;
}

function StartupScreen({ onEnter, xrSupport }: { onEnter: () => void; xrSupport: XrSupportState }) {
  return <section className="startup-screen" aria-label="Bloch Stereo startup"><div className="startup-glow" aria-hidden="true" /><div className="startup-card">
    <Brand /><p className="startup-version">Version {__APP_VERSION__}</p>
    <button type="button" className="startup-enter" onClick={onEnter}>Enter <span aria-hidden="true">→</span></button>
    <p className="startup-mode-note">{xrSupport === "supported" ? "VR ready" : xrSupport === "unsupported" ? "Anaglyph stereo ready" : "Checking display capabilities…"}</p>
    <div className="startup-credit">
      <span>Produced by</span>
      <img className="startup-sqai-logo" src={`${import.meta.env.BASE_URL}assets/sqai-basic-en-rgb350ppi.png`} alt="SQAI" />
    </div>
  </div></section>;
}

function PresetSelector({ selectedPreset, userPresets, loadPreset, saveUserPreset }: { selectedPreset?: PresetName; userPresets: UserPreset[]; loadPreset: (preset: PresetName) => void; saveUserPreset: () => void }) {
  const options = [...builtInPresetOptions, ...userPresets.map(({ value, label }) => ({ value, label }))];
  return <div className="preset-field"><label>Preset<select value={selectedPreset ?? ""} onChange={(event) => { const preset = event.currentTarget.value as PresetName; if (preset) loadPreset(preset); event.currentTarget.blur(); }}><option value="">Choose circuit</option>{options.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}</select></label><button type="button" onClick={saveUserPreset} title="Save current circuit as a preset"><Save aria-hidden="true" />SAVE</button></div>;
}

const correlationPairs: Array<[number, number]> = [[0, 1], [0, 2], [1, 2]];

function CorrelationPairSelector({ pair, onChange }: { pair: [number, number]; onChange: (pair: [number, number]) => void }) {
  return <div className="correlation-pair-selector" aria-label="Correlation pair">{correlationPairs.map(([first, second]) => <button key={`${first}-${second}`} type="button" className={pair[0] === first && pair[1] === second ? "is-active" : ""} onClick={() => onChange([first, second])}>q{first}/q{second}</button>)}</div>;
}

function StereoCalibration({ isStereoMode, xrSupport, stereoSettings, setStereoSettings, resetStereoSettings }: { isStereoMode: boolean; xrSupport: XrSupportState; stereoSettings: StereoSettings; setStereoSettings: (settings: Partial<StereoSettings>) => void; resetStereoSettings: () => void }) {
  return <div className="editor-stereo-settings" aria-label="View and color settings">
    <RangeSetting label="Eye" min="0.04" max="0.3" step="0.01" value={stereoSettings.eyeSeparation} onChange={(eyeSeparation) => setStereoSettings({ eyeSeparation })} digits={2} />
    <RangeSetting label="Focus" min="2.8" max="8" step="0.1" value={stereoSettings.convergenceDistance} onChange={(convergenceDistance) => setStereoSettings({ convergenceDistance })} digits={1} />
    {xrSupport !== "supported" ? <><RangeSetting label="Red" min="0.3" max="1.3" step="0.05" value={stereoSettings.redGain} onChange={(redGain) => setStereoSettings({ redGain })} digits={2} disabled={!isStereoMode} /><RangeSetting label="Cyan" min="0.2" max="1.2" step="0.05" value={stereoSettings.cyanGain} onChange={(cyanGain) => setStereoSettings({ cyanGain })} digits={2} disabled={!isStereoMode} /></> : null}
    <button type="button" onClick={resetStereoSettings}><RotateCcw aria-hidden="true" />Default</button>
  </div>;
}

function RangeSetting({ label, value, min, max, step, digits, disabled = false, onChange }: { label: string; value: number; min: string; max: string; step: string; digits: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <label><span className="setting-label">{label}</span><input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.currentTarget.value))} /><output>{value.toFixed(digits)}</output></label>;
}
