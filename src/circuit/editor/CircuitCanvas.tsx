import { Trash2 } from "lucide-react";
import type { Circuit, GateOp } from "../types";

type CircuitCanvasProps = {
  circuit: Circuit;
  currentStep: number;
  onStepSelect: (step: number) => void;
  onDeleteGate: (opId: string) => void;
};

const COLUMN_WIDTH = 82;
const ROW_HEIGHT = 66;
const LEFT_MARGIN = 58;
const TOP_MARGIN = 34;

export function CircuitCanvas({ circuit, currentStep, onStepSelect, onDeleteGate }: CircuitCanvasProps) {
  const width = Math.max(680, LEFT_MARGIN + circuit.ops.length * COLUMN_WIDTH + 120);
  const height = TOP_MARGIN + circuit.numQubits * ROW_HEIGHT + 30;

  return (
    <div className="circuit-scroll">
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
      <div className="op-strip">
        {circuit.ops.map((op, index) => (
          <button
            type="button"
            key={op.id}
            className={currentStep === index + 1 ? "op-chip is-current" : "op-chip"}
            onClick={() => onStepSelect(index + 1)}
          >
            <span>{index + 1}</span>
            {formatGate(op)}
            <Trash2
              aria-label="Delete gate"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteGate(op.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onDeleteGate(op.id);
              }}
            />
          </button>
        ))}
      </div>
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
  return (
    <g className={current ? "gate-glyph is-current" : "gate-glyph"} onClick={onSelect}>
      <GateBox x={x} y={y} label={op.name === "measure" ? "M" : op.name.toUpperCase()} />
    </g>
  );
}

function GateBox({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 22} y={y - 22} width={44} height={44} rx={8} className="gate-box" />
      <text x={x} y={y + 6} textAnchor="middle" className="gate-label">
        {label}
      </text>
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
  if (op.name === "measure") return `M q${op.targets[0]} -> c${op.clbits?.[0] ?? 0}`;
  if (op.name === "cx" || op.name === "cz") return `${op.name.toUpperCase()} q${op.controls?.[0]} -> q${op.targets[0]}`;
  if (op.name === "swap") return `SWAP q${op.targets[0]}, q${op.targets[1]}`;
  return `${op.name.toUpperCase()} q${op.targets[0]}`;
}
