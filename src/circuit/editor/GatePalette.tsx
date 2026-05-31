import type { GateName } from "../types";
import { useAppStore } from "../../store/useAppStore";

const gateGroups: Array<{ label: string; gates: GateName[] }> = [
  { label: "1Q", gates: ["h", "x", "y", "z", "s", "sdg", "t", "tdg", "rx", "ry", "rz"] },
  { label: "2Q", gates: ["cx", "cz"] },
  { label: "Noise", gates: ["depolarize", "dephase", "ampdamp"] },
  { label: "Read", gates: ["measure"] },
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
                onClick={() => setSelectedGate(gate)}
              >
                {formatGateLabel(gate)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatGateLabel(gate: GateName): string {
  if (gate === "sdg") return "S+";
  if (gate === "tdg") return "T+";
  if (gate === "depolarize") return "DEP";
  if (gate === "dephase") return "PHASE";
  if (gate === "ampdamp") return "DAMP";
  return gate.toUpperCase();
}
