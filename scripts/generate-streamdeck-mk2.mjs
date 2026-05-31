import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = new URL("../streamdeck/mk2/", import.meta.url);

const keys = [
  {
    file: "prev.svg",
    title: "Prev",
    subtitle: "Step",
    key: "ArrowLeft",
    glyph: "‹",
    color: "#38bdf8",
    position: { row: 1, column: 2 },
  },
  {
    file: "next.svg",
    title: "Next",
    subtitle: "Step",
    key: "ArrowRight",
    glyph: "›",
    color: "#38bdf8",
    position: { row: 1, column: 4 },
  },
  {
    file: "reset.svg",
    title: "Reset",
    subtitle: "Run",
    key: "R or Home",
    glyph: "↺",
    color: "#f59e0b",
    position: { row: 2, column: 2 },
  },
  {
    file: "editor.svg",
    title: "Editor",
    subtitle: "Toggle",
    key: "E",
    glyph: "▯",
    color: "#a78bfa",
    position: { row: 2, column: 3 },
  },
  {
    file: "add.svg",
    title: "Add",
    subtitle: "Gate",
    key: "+",
    glyph: "+",
    color: "#22c55e",
    position: { row: 2, column: 4 },
  },
  {
    file: "rotate.svg",
    title: "Rotate",
    subtitle: "Hold",
    key: "C",
    glyph: "⟳",
    color: "#fb7185",
    position: { row: 3, column: 2 },
  },
  {
    file: "zoom.svg",
    title: "Zoom",
    subtitle: "Hold",
    key: "Z",
    glyph: "⇅",
    color: "#facc15",
    position: { row: 3, column: 4 },
  },
];

await mkdir(outputDir, { recursive: true });

await Promise.all(
  keys.map((key) => writeFile(new URL(key.file, outputDir), createIcon(key), "utf8")),
);

await writeFile(
  new URL("keymap.json", outputDir),
  `${JSON.stringify(
    {
      device: "Elgato Stream Deck MK.2",
      application: "Bloch Stereo",
      usage: "Assign each Stream Deck key to the Hotkey action shown in `hotkey`, then set the icon file as the key image.",
      keys: keys.map(({ file, title, key, position }) => ({
        title,
        hotkey: key,
        icon: file,
        position,
      })),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

await writeFile(
  new URL("README.md", outputDir),
  `# Bloch Stereo Stream Deck MK.2 Icons

Generated files for assigning Stream Deck keys to Bloch Stereo keyboard shortcuts.

## Suggested Layout

\`\`\`txt
[   ] [Prev] [   ] [Next] [   ]
[   ] [Reset][Edit ][Add ] [   ]
[   ] [Rotate][   ][Zoom] [   ]
\`\`\`

## Hotkeys

| Action | Hotkey | Icon |
| --- | --- | --- |
${keys.map((key) => `| ${key.title} ${key.subtitle} | \`${key.key}\` | \`${key.file}\` |`).join("\n")}

## Setup

### macOS

1. Install the macOS Stream Deck app from Elgato:

   \`\`\`txt
   https://www.elgato.com/downloads
   \`\`\`

2. Generate these assets from the repository root:

   \`\`\`sh
   npm run streamdeck:mk2
   \`\`\`

3. Open the Stream Deck app.

4. Drag **System > Hotkey** onto each Stream Deck key.

5. Use this suggested MK.2 layout:

   \`\`\`txt
   [   ] [Prev] [   ] [Next] [   ]
   [   ] [Reset][Edit ][Add ] [   ]
   [   ] [Rotate][   ][Zoom] [   ]
   \`\`\`

6. Set each Hotkey action:

   - Prev: \`ArrowLeft\`
   - Next: \`ArrowRight\`
   - Reset: \`R\` or \`Home\`
   - Editor: \`E\`
   - Add: \`+\`
   - Rotate: \`C\`
   - Zoom: \`Z\`

7. Set each key image:

   - Prev: \`streamdeck/mk2/prev.svg\`
   - Next: \`streamdeck/mk2/next.svg\`
   - Reset: \`streamdeck/mk2/reset.svg\`
   - Editor: \`streamdeck/mk2/editor.svg\`
   - Add: \`streamdeck/mk2/add.svg\`
   - Rotate: \`streamdeck/mk2/rotate.svg\`
   - Zoom: \`streamdeck/mk2/zoom.svg\`

8. Start Bloch Stereo:

   \`\`\`sh
   npm run dev
   \`\`\`

9. Open the Vite URL, usually:

   \`\`\`txt
   http://localhost:5173/
   \`\`\`

10. Keep the browser page focused when pressing Stream Deck keys.

Shortcuts are ignored while an input, select, textarea, QASM editor, or content-editable element has focus. This prevents accidental edits while entering angles, probabilities, or QASM text.

Hold Rotate while moving the mouse to rotate the Bloch view. Hold Zoom while moving the mouse up or down to zoom the Bloch view.

Direct Stream Deck SDK integration is not required for these keys.
`,
  "utf8",
);

console.log(`Generated Stream Deck MK.2 assets in ${outputDir.pathname}`);

function createIcon({ title, subtitle, glyph, color }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#101827"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="144" height="144" rx="24" fill="url(#bg)"/>
  <rect x="10" y="10" width="124" height="124" rx="20" fill="none" stroke="${color}" stroke-opacity="0.45" stroke-width="3"/>
  <circle cx="72" cy="58" r="34" fill="${color}" fill-opacity="0.16" filter="url(#shadow)"/>
  <text x="72" y="73" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="62" font-weight="800" fill="${color}">${escapeXml(glyph)}</text>
  <text x="72" y="111" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="#f8fafc">${escapeXml(title)}</text>
  <text x="72" y="130" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#94a3b8">${escapeXml(subtitle)}</text>
</svg>
`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
