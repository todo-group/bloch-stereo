import type { GateName } from "../types";
import { useAppStore } from "../../store/useAppStore";

const gateGroups: Array<{ label: string; gates: GateName[] }> = [
  { label: "1Q", gates: ["h", "x", "y", "z", "s", "sdg", "t", "tdg", "rx", "ry", "rz"] },
  { label: "2Q", gates: ["cx", "cz"] },
  { label: "Noise", gates: ["depolarize", "dephase", "ampdamp"] },
  { label: "Measure", gates: ["measure"] },
];

export function GatePalette() {
  const { selectedGate, setSelectedGate } = useAppStore();

  return (
    <div className="gate-palette" aria-label="Gate palette">
      {gateGroups.map((group) => (
        <div className="gate-group" key={group.label}>
          <span>{group.label}</span>
          <div>
            {group.gates.map((gate) => (
              <button
                type="button"
                key={gate}
                className={selectedGate === gate ? "is-selected" : ""}
                aria-label={gate === "measure" ? "Measure" : undefined}
                title={formatGateTitle(gate)}
                onClick={() => setSelectedGate(gate)}
              >
                <GatePaletteSymbol gate={gate} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GatePaletteSymbol({ gate }: { gate: GateName }) {
  if (gate === "measure") {
    return <svg className="palette-meter" viewBox="0 0 32 32" aria-hidden="true"><path d="M 5 23 A 12 12 0 0 1 27 23" /><line x1="16" y1="22" x2="23" y2="10" /><circle cx="16" cy="22" r="2" /></svg>;
  }
  if (isNoiseGate(gate)) return <span className="palette-noise-symbol">{formatGateLabel(gate)}</span>;
  return <>{formatGateLabel(gate)}</>;
}

function formatGateLabel(gate: GateName): string {
  if (gate === "sdg") return "S+";
  if (gate === "tdg") return "T+";
  if (gate === "depolarize") return "XYZ≈";
  if (gate === "dephase") return "Z≈";
  if (gate === "ampdamp") return "↓";
  return gate.toUpperCase();
}

function formatGateTitle(gate: GateName): string {
  if (gate === "depolarize") return "Depolarizing channel";
  if (gate === "dephase") return "Dephasing channel";
  if (gate === "ampdamp") return "Amplitude damping channel";
  if (gate === "measure") return "Measure";
  return formatGateLabel(gate);
}

function isNoiseGate(gate: GateName): boolean {
  return gate === "depolarize" || gate === "dephase" || gate === "ampdamp";
}
