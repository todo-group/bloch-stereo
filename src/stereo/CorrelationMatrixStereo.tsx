import { Fragment, type CSSProperties } from "react";
import type { DisplayMode } from "../circuit/types";

type CorrelationMatrixStereoProps = {
  matrix: number[][];
  displayMode: DisplayMode;
};

const labels = ["X", "Y", "Z"];

export function CorrelationMatrixStereo({ matrix, displayMode }: CorrelationMatrixStereoProps) {
  return (
    <div className={displayMode === "anaglyph-red-green" ? "correlation is-stereo" : "correlation"}>
      <header>
        <span>Correlation q0/q1</span>
      </header>
      <div className="matrix-grid">
        <span />
        {labels.map((label) => (
          <b key={label}>{label}</b>
        ))}
        {matrix.map((row, rowIndex) => (
          <Fragment key={`row-${labels[rowIndex]}`}>
            <b key={`label-${labels[rowIndex]}`}>{labels[rowIndex]}</b>
            {row.map((value, colIndex) => (
              <span
                key={`${rowIndex}-${colIndex}`}
                style={
                  {
                    "--intensity": Math.abs(value).toFixed(3),
                    "--polarity": value >= 0 ? 1 : -1,
                  } as CSSProperties
                }
              >
                {value.toFixed(2)}
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
