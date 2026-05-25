import type { GateName } from "../types";
import { useAppStore } from "../../store/useAppStore";

const gateGroups: Array<{ label: string; gates: GateName[] }> = [
  { label: "1Q", gates: ["h", "x", "y", "z", "s", "t", "rx", "ry", "rz"] },
  { label: "2Q", gates: ["cx", "cz", "swap"] },
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
                {gate.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
