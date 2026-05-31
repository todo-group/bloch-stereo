import { useEffect, useReducer, useState } from "react";
import { BlochSphere } from "./BlochSphere";
import {
  GATES,
  MINUS,
  MINUS_I,
  ONE,
  PLUS,
  PLUS_I,
  ZERO,
  applyGate,
  blochVector,
  fmtC,
  haarRandom,
  measureZ,
  prob0,
  prob1,
  type Qubit,
} from "./qubit";

type Entry = {
  state: Qubit;
  label: string;
  measured?: 0 | 1;
  measurementSource?: Qubit;
};

type State = {
  history: Entry[];
  index: number;
};

type Action =
  | { type: "init"; state: Qubit; label: string }
  | { type: "gate"; name: string }
  | { type: "measure" }
  | { type: "back" }
  | { type: "forward" }
  | { type: "goto"; index: number };

function sampleMeasurementEntry(source: Qubit): Entry {
  const { result, collapsed } = measureZ(source);
  return { state: collapsed, label: "M", measured: result, measurementSource: source };
}

function collapseMeasurementEntry(source: Qubit, result: 0 | 1): Entry {
  return { state: result === 0 ? ZERO : ONE, label: "M", measured: result, measurementSource: source };
}

function rebuildHistoryThrough(history: Entry[], targetIndex: number): Entry[] {
  const rebuilt: Entry[] = [history[0]];

  for (let i = 1; i < history.length; i++) {
    const previous = rebuilt[i - 1];
    const entry = history[i];

    if (entry.measurementSource) {
      rebuilt.push(
        i <= targetIndex || entry.measured === undefined
          ? sampleMeasurementEntry(previous.state)
          : collapseMeasurementEntry(previous.state, entry.measured),
      );
      continue;
    }

    const gate = GATES[entry.label];
    if (gate) {
      rebuilt.push({ state: applyGate(gate, previous.state), label: entry.label });
      continue;
    }

    rebuilt.push(entry);
  }

  return rebuilt;
}

function reducer(state: State, action: Action): State {
  const cur = state.history[state.index];
  const slice = state.history.slice(0, state.index + 1);

  switch (action.type) {
    case "init":
      return { history: [{ state: action.state, label: action.label }], index: 0 };

    case "gate": {
      const gate = GATES[action.name];
      if (!gate) return state;
      const next: Entry = { state: applyGate(gate, cur.state), label: action.name };
      return { history: [...slice, next], index: slice.length };
    }

    case "measure": {
      const measurementSource = cur.measurementSource ?? cur.state;
      const next = sampleMeasurementEntry(measurementSource);
      if (cur.measurementSource) {
        return { history: [...state.history.slice(0, state.index), next], index: state.index };
      }
      return { history: [...slice, next], index: slice.length };
    }

    case "back":
      return { ...state, index: Math.max(0, state.index - 1) };

    case "forward": {
      const nextIndex = Math.min(state.history.length - 1, state.index + 1);
      if (nextIndex === state.index) return state;
      return { history: rebuildHistoryThrough(state.history, nextIndex), index: nextIndex };
    }

    case "goto": {
      const nextIndex = Math.max(0, Math.min(state.history.length - 1, action.index));
      if (nextIndex <= state.index) return { ...state, index: nextIndex };
      return { history: rebuildHistoryThrough(state.history, nextIndex), index: nextIndex };
    }
  }
}

const INIT_OPTIONS: { label: string; state: Qubit }[] = [
  { label: "|0⟩", state: ZERO },
  { label: "|1⟩", state: ONE },
  { label: "|+⟩", state: PLUS },
  { label: "|-⟩", state: MINUS },
  { label: "|i⟩", state: PLUS_I },
  { label: "|-i⟩", state: MINUS_I },
];

export function App() {
  const [{ history, index }, dispatch] = useReducer(reducer, {
    history: [{ state: ZERO, label: "|0⟩" }],
    index: 0,
  });
  const [stereoEnabled, setStereoEnabled] = useState(false);
  const [eyeSeparation, setEyeSeparation] = useState(0.12);
  const [stereoFocus, setStereoFocus] = useState(4.2);
  const [redGain, setRedGain] = useState(1);
  const [cyanGain, setCyanGain] = useState(0.82);

  const cur = history[index];
  const vec = blochVector(cur.state);
  const p0 = prob0(cur.state);
  const p1 = prob1(cur.state);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        dispatch({ type: "back" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        dispatch({ type: "forward" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <h1>Single Qubit</h1>
        <div className="step-counter">
          <span>{index}</span>
          <small>/ {history.length - 1}</small>
        </div>
      </header>

      <div className="layout">
        <BlochSphere
          vector={vec}
          activeStep={index}
          stereoEnabled={stereoEnabled}
          eyeSeparation={eyeSeparation}
          stereoFocus={stereoFocus}
          redGain={redGain}
          cyanGain={cyanGain}
        />

        <aside className="sidebar">
          <section className="panel">
            <h2>Initialize</h2>
            <div className="btn-row">
              {INIT_OPTIONS.map(({ label, state }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => dispatch({ type: "init", state, label })}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => dispatch({ type: "init", state: haarRandom(), label: "Haar" })}
              >
                Haar
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Gate</h2>
            <div className="btn-row">
              {Object.keys(GATES).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => dispatch({ type: "gate", name })}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <button
              type="button"
              className="measure-btn"
              onClick={() => dispatch({ type: "measure" })}
            >
              Measure (Z-basis)
            </button>
          </section>

          <section className="panel">
            <button
              type="button"
              className={`stereo-btn${stereoEnabled ? " is-active" : ""}`}
              aria-pressed={stereoEnabled}
              onClick={() => setStereoEnabled((enabled) => !enabled)}
            >
              Anaglyph Stereo
            </button>
            <label className="range-control">
              <span>Eye separation</span>
              <input
                type="range"
                min="0.04"
                max="0.3"
                step="0.01"
                value={eyeSeparation}
                onChange={(event) => setEyeSeparation(Number(event.currentTarget.value))}
              />
              <output>{eyeSeparation.toFixed(2)}</output>
            </label>
            <label className="range-control">
              <span>Stereo focus</span>
              <input
                type="range"
                min="2.8"
                max="8"
                step="0.1"
                value={stereoFocus}
                onChange={(event) => setStereoFocus(Number(event.currentTarget.value))}
              />
              <output>{stereoFocus.toFixed(1)}</output>
            </label>
            <label className="range-control">
              <span>Red image</span>
              <input
                type="range"
                min="0.3"
                max="1.3"
                step="0.05"
                value={redGain}
                onChange={(event) => setRedGain(Number(event.currentTarget.value))}
              />
              <output>{redGain.toFixed(2)}</output>
            </label>
            <label className="range-control">
              <span>Cyan image</span>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={cyanGain}
                onChange={(event) => setCyanGain(Number(event.currentTarget.value))}
              />
              <output>{cyanGain.toFixed(2)}</output>
            </label>
          </section>

          <section className="panel state-panel">
            <h2>State</h2>
            <div className="state-vec">
              <div>
                <span className="coeff">{fmtC(cur.state[0])}</span>
                <span className="ket"> |0⟩</span>
              </div>
              <div>
                <span className="coeff">{fmtC(cur.state[1])}</span>
                <span className="ket"> |1⟩</span>
              </div>
            </div>
            <div className="probs">
              <div className="prob-bar">
                <span>P(0)</span>
                <div className="bar-track">
                  <div className="bar-fill bar-0" style={{ width: `${p0 * 100}%` }} />
                </div>
                <span className="prob-val">{p0.toFixed(3)}</span>
              </div>
              <div className="prob-bar">
                <span>P(1)</span>
                <div className="bar-track">
                  <div className="bar-fill bar-1" style={{ width: `${p1 * 100}%` }} />
                </div>
                <span className="prob-val">{p1.toFixed(3)}</span>
              </div>
            </div>
            <div className="bloch-coords">
              <span>x&thinsp;{vec.x >= 0 ? " " : ""}{vec.x.toFixed(3)}</span>
              <span>y&thinsp;{vec.y >= 0 ? " " : ""}{vec.y.toFixed(3)}</span>
              <span>z&thinsp;{vec.z >= 0 ? " " : ""}{vec.z.toFixed(3)}</span>
            </div>
          </section>

          <section className="panel">
            <h2>History</h2>
            <div className="history">
              {history.map((entry, i) => (
                <button
                  key={i}
                  type="button"
                  className={`hist-item${i === index ? " is-active" : ""}`}
                  onClick={() => dispatch({ type: "goto", index: i })}
                >
                  {entry.label}
                  {entry.measured !== undefined ? `=${entry.measured}` : ""}
                </button>
              ))}
            </div>
            <div className="hint">← → to navigate</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
