import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { Circuit, GateOp } from "../types";

type CircuitCanvasProps = {
  circuit: Circuit;
  currentStep: number;
  onStepSelect: (step: number) => void;
  onDeleteGate?: (opId: string) => void;
  readOnly?: boolean;
  compact?: boolean;
};

const COLUMN_WIDTH = 82;
const ROW_HEIGHT = 66;
const LEFT_MARGIN = 58;
const TOP_MARGIN = 34;

export function CircuitCanvas({ circuit, currentStep, onStepSelect, onDeleteGate, readOnly = false, compact = false }: CircuitCanvasProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const width = Math.max(680, LEFT_MARGIN + circuit.ops.length * COLUMN_WIDTH + 120);
  const height = TOP_MARGIN + circuit.numQubits * ROW_HEIGHT + 30;

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || currentStep <= 0) return;
    const currentX = LEFT_MARGIN + (currentStep - 1) * COLUMN_WIDTH + 32;
    scroll.scrollTo({
      left: Math.max(0, currentX - scroll.clientWidth / 2),
      behavior: "smooth",
    });
  }, [currentStep]);

  return (
    <div className={`circuit-scroll${readOnly ? " is-read-only" : ""}${compact ? " is-compact" : ""}`} ref={scrollRef}>
      <svg width={width} height={height} role="img" aria-label="Quantum circuit timeline">
        {Array.from({ length: circuit.numQubits }, (_, qubit) => {
          const y = TOP_MARGIN + qubit * ROW_HEIGHT;
          return (
            <g key={qubit}>
              <text x={16} y={y + 5} className="wire-label">
                q{qubit}
              </text>
              <line x1={LEFT_MARGIN} y1={y} x2={width - 28} y2={y} className="wire" />
            </g>
          );
        })}
        {circuit.ops.map((op, index) => (
          <GateGlyph
            key={op.id}
            op={op}
            x={LEFT_MARGIN + index * COLUMN_WIDTH + 32}
            current={currentStep === index + 1}
            onSelect={() => onStepSelect(index + 1)}
          />
        ))}
      </svg>
      {compact ? null : <div className="op-strip">
        {circuit.ops.map((op, index) => (
          <div
            key={op.id}
            className={currentStep === index + 1 ? "op-chip is-current" : "op-chip"}
          >
            <button type="button" className="op-select" onClick={() => onStepSelect(index + 1)}>
              <span>{index + 1}</span>
              {formatGate(op)}
            </button>
            {!readOnly && onDeleteGate ? <button type="button" className="delete-op" aria-label={`Delete ${formatGate(op)}`} onClick={() => onDeleteGate(op.id)}>
              <Trash2 aria-hidden="true" />
            </button> : null}
          </div>
        ))}
      </div>}
    </div>
  );
}

function GateGlyph({
  op,
  x,
  current,
  onSelect,
}: {
  op: GateOp;
  x: number;
  current: boolean;
  onSelect: () => void;
}) {
  if (op.name === "cx" || op.name === "cz") {
    const controlY = TOP_MARGIN + (op.controls?.[0] ?? 0) * ROW_HEIGHT;
    const targetY = TOP_MARGIN + op.targets[0] * ROW_HEIGHT;
    return (
      <g className={current ? "gate-glyph is-current" : "gate-glyph"} onClick={onSelect}>
        <line x1={x} y1={controlY} x2={x} y2={targetY} className="control-line" />
        <circle cx={x} cy={controlY} r={8} className="control-dot" />
        {op.name === "cx" ? (
          <g>
            <circle cx={x} cy={targetY} r={17} className="target-ring" />
            <line x1={x - 12} y1={targetY} x2={x + 12} y2={targetY} className="target-cross" />
            <line x1={x} y1={targetY - 12} x2={x} y2={targetY + 12} className="target-cross" />
          </g>
        ) : (
          <GateBox x={x} y={targetY} label="CZ" />
        )}
      </g>
    );
  }

  if (op.name === "swap") {
    const firstY = TOP_MARGIN + op.targets[0] * ROW_HEIGHT;
    const secondY = TOP_MARGIN + op.targets[1] * ROW_HEIGHT;
    return (
      <g className={current ? "gate-glyph is-current" : "gate-glyph"} onClick={onSelect}>
        <line x1={x} y1={firstY} x2={x} y2={secondY} className="control-line" />
        <SwapMark x={x} y={firstY} />
        <SwapMark x={x} y={secondY} />
      </g>
    );
  }

  const y = TOP_MARGIN + op.targets[0] * ROW_HEIGHT;
  if (isNoiseGate(op)) {
    return (
      <g className={current ? "gate-glyph is-current noise-channel-glyph" : "gate-glyph noise-channel-glyph"} onClick={onSelect}>
        <NoiseChannelBox x={x} y={y} label={formatGateLabel(op)} />
      </g>
    );
  }
  if (op.name === "measure") {
    return (
      <g className={current ? "gate-glyph is-current measurement-glyph" : "gate-glyph measurement-glyph"} onClick={onSelect}>
        <MeasurementMeter x={x} y={y} />
      </g>
    );
  }
  return (
    <g className={current ? "gate-glyph is-current" : "gate-glyph"} onClick={onSelect}>
      <GateBox x={x} y={y} label={formatGateLabel(op)} />
    </g>
  );
}

function GateBox({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 22} y={y - 22} width={44} height={44} className="gate-box" />
      <text x={x} y={y + 6} textAnchor="middle" className="gate-label">
        {label}
      </text>
    </g>
  );
}

function NoiseChannelBox({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 17} y={y - 26} width={42} height={42} className="gate-box noise-channel-box noise-channel-back" />
      <rect x={x - 25} y={y - 18} width={42} height={42} className="gate-box noise-channel-box noise-channel-front" />
      <text x={x - 4} y={y + 7} textAnchor="middle" className="gate-label noise-channel-label">{label}</text>
    </g>
  );
}

function MeasurementMeter({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 22} y={y - 22} width={44} height={44} className="gate-box measurement-box" />
      <path d={`M ${x - 14} ${y + 9} A 16 16 0 0 1 ${x + 14} ${y + 9}`} className="meter-arc" />
      <line x1={x} y1={y + 8} x2={x + 9} y2={y - 8} className="meter-needle" />
      <circle cx={x} cy={y + 8} r={2.5} className="meter-pivot" />
    </g>
  );
}

function SwapMark({ x, y }: { x: number; y: number }) {
  return (
    <g className="swap-mark">
      <line x1={x - 11} y1={y - 11} x2={x + 11} y2={y + 11} />
      <line x1={x + 11} y1={y - 11} x2={x - 11} y2={y + 11} />
    </g>
  );
}

function formatGate(op: GateOp): string {
  if (op.name === "measure") return `Measure q${op.targets[0]} -> c${op.clbits?.[0] ?? 0}`;
  if (op.name === "cx" || op.name === "cz") return `${op.name.toUpperCase()} q${op.controls?.[0]} -> q${op.targets[0]}`;
  if (op.name === "swap") return `SWAP q${op.targets[0]}, q${op.targets[1]}`;
  const angle = isRotationGate(op) && op.params?.[0] !== undefined ? `(${formatDegrees(op.params[0])}deg)` : "";
  const probability = isNoiseGate(op) && op.params?.[0] !== undefined ? `(${op.params[0].toFixed(2)})` : "";
  return `${formatGateLabel(op)}${angle}${probability} q${op.targets[0]}`;
}

function formatGateLabel(op: GateOp): string {
  if (op.name === "measure") return "";
  if (op.name === "sdg") return "S+";
  if (op.name === "tdg") return "T+";
  if (op.name === "depolarize") return "XYZ≈";
  if (op.name === "dephase") return "Z≈";
  if (op.name === "ampdamp") return "↓";
  return op.name.toUpperCase();
}

function isRotationGate(op: GateOp): boolean {
  return op.name === "rx" || op.name === "ry" || op.name === "rz";
}

function isNoiseGate(op: GateOp): boolean {
  return op.name === "depolarize" || op.name === "dephase" || op.name === "ampdamp";
}

function formatDegrees(radians: number): string {
  const degrees = (radians * 180) / Math.PI;
  return Math.abs(degrees - Math.round(degrees)) < 1e-6 ? String(Math.round(degrees)) : degrees.toFixed(2);
}
