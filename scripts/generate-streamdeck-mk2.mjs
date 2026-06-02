import { mkdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";

const outputDir = new URL("../streamdeck/mk2/", import.meta.url);
const profileFileName = "Bloch Stereo MK2.streamDeckProfile";
const profileName = "Bloch Stereo";
const streamDeckMk2Model = "20GBA9901";
const profileUuid = "F4EF7866-7A6D-4A63-9515-4F5AC25F088A";
const zip = promisify(execFile);
const hotkeyMap = {
  "+": { NativeCode: 43, QTKeyCode: 43, VKeyCode: 187 },
  ArrowLeft: { NativeCode: 37, QTKeyCode: 16777234, VKeyCode: 37 },
  ArrowRight: { NativeCode: 124, QTKeyCode: 16777236, VKeyCode: 39 },
  B: { NativeCode: 66, QTKeyCode: 66, VKeyCode: 66 },
  C: { NativeCode: 67, QTKeyCode: 67, VKeyCode: 67 },
  E: { NativeCode: 69, QTKeyCode: 69, VKeyCode: 69 },
  R: { NativeCode: 82, QTKeyCode: 82, VKeyCode: 82 },
  S: { NativeCode: 83, QTKeyCode: 83, VKeyCode: 83 },
  T: { NativeCode: 84, QTKeyCode: 84, VKeyCode: 84 },
  V: { NativeCode: 86, QTKeyCode: 86, VKeyCode: 86 },
  Z: { NativeCode: 90, QTKeyCode: 90, VKeyCode: 90 },
};
const font5x7 = {
  "?": ["111", "001", "010", "010", "000", "010", "000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["111", "010", "010", "010", "010", "010", "111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

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
    file: "stereo.svg",
    title: "Stereo",
    subtitle: "Mode",
    key: "S",
    glyph: "◎",
    color: "#f472b6",
    position: { row: 1, column: 3 },
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
    profileKey: "R",
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
    file: "top.svg",
    title: "Top",
    subtitle: "View",
    key: "T",
    glyph: "⇩",
    color: "#60d394",
    position: { row: 3, column: 1 },
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
    file: "view.svg",
    title: "View",
    subtitle: "Restore",
    key: "V",
    glyph: "◎",
    color: "#7dd3fc",
    position: { row: 3, column: 3 },
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
  {
    file: "bottom.svg",
    title: "Bottom",
    subtitle: "View",
    key: "B",
    glyph: "⇧",
    color: "#60d394",
    position: { row: 3, column: 5 },
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
      usage: "Assign each Stream Deck key to the action shown in `action`, then set the icon file as the key image.",
      profile: profileFileName,
      keys: keys.map(({ action, file, title, key, position }) => ({
        title,
        action: action ?? "Hotkey",
        value: key,
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
[   ] [Prev] [Stereo][Next] [   ]
[   ] [Reset][Edit ][Add ] [   ]
[Top] [Rotate][View ][Zoom] [Bottom]
\`\`\`

## Actions

| Action | Stream Deck action | Value | Icon |
| --- | --- | --- | --- |
${keys.map((key) => `| ${key.title} ${key.subtitle} | ${key.action ?? "Hotkey"} | \`${key.key}\` | \`${key.file}\` |`).join("\n")}

## Manual Setup

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

4. Drag **System > Hotkey** onto each Stream Deck key, matching the table below.

5. Use this suggested MK.2 layout:

   \`\`\`txt
   [   ] [Prev] [Stereo][Next] [   ]
   [   ] [Reset][Edit ][Add ] [   ]
   [Top] [Rotate][View ][Zoom] [Bottom]
   \`\`\`

6. Set each key action:

   - Prev: **System > Hotkey**, \`ArrowLeft\`
   - Stereo: **System > Hotkey**, \`S\`
   - Next: **System > Hotkey**, \`ArrowRight\`
   - Reset: **System > Hotkey**, \`R\` or \`Home\`
   - Editor: **System > Hotkey**, \`E\`
   - Add: **System > Hotkey**, \`+\`
   - Top: **System > Hotkey**, \`T\`
   - Rotate: **System > Hotkey**, \`C\`
   - View: **System > Hotkey**, \`V\`
   - Zoom: **System > Hotkey**, \`Z\`
   - Bottom: **System > Hotkey**, \`B\`

7. Set each key image:

   - Prev: \`streamdeck/mk2/prev.svg\`
   - Stereo: \`streamdeck/mk2/stereo.svg\`
   - Next: \`streamdeck/mk2/next.svg\`
   - Reset: \`streamdeck/mk2/reset.svg\`
   - Editor: \`streamdeck/mk2/editor.svg\`
   - Add: \`streamdeck/mk2/add.svg\`
   - Top: \`streamdeck/mk2/top.svg\`
   - Rotate: \`streamdeck/mk2/rotate.svg\`
   - View: \`streamdeck/mk2/view.svg\`
   - Zoom: \`streamdeck/mk2/zoom.svg\`
   - Bottom: \`streamdeck/mk2/bottom.svg\`

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

Hold Rotate while moving the mouse to rotate the Bloch view. Hold Zoom while moving the mouse up or down to zoom the Bloch view. Press Top, View, or Bottom to move the Bloch camera to that preset view.

Direct Stream Deck SDK integration is not required for these keys.
`,
  "utf8",
);

await createStreamDeckProfile(keys);

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

function createIconPng(key) {
  const canvas = createBitmap(144, 144);
  const color = hexToRgb(key.color);
  fillGradient(canvas, hexToRgb("#101827"), hexToRgb("#020617"));
  strokeRoundedRect(canvas, 10, 10, 124, 124, 20, color, 0.45, 3);
  fillCircle(canvas, 72, 58, 34, color, 0.16);
  drawGlyph(canvas, key.glyph, 72, 57, color);
  drawText(canvas, key.title.toUpperCase(), 72, 100, 4, hexToRgb("#f8fafc"), "center");
  drawText(canvas, key.subtitle.toUpperCase(), 72, 124, 2, hexToRgb("#94a3b8"), "center");
  return encodePng(canvas);
}

function createBitmap(width, height) {
  return {
    width,
    height,
    pixels: new Uint8Array(width * height * 4),
  };
}

function fillGradient(bitmap, top, bottom) {
  for (let y = 0; y < bitmap.height; y += 1) {
    const amount = y / Math.max(1, bitmap.height - 1);
    const color = mixColor(top, bottom, amount);
    for (let x = 0; x < bitmap.width; x += 1) {
      setPixel(bitmap, x, y, color, 1);
    }
  }
}

function strokeRoundedRect(bitmap, x, y, width, height, radius, color, alpha, thickness) {
  for (let line = 0; line < thickness; line += 1) {
    const inset = line;
    for (let px = x + radius; px <= x + width - radius; px += 1) {
      setPixel(bitmap, px, y + inset, color, alpha);
      setPixel(bitmap, px, y + height - inset, color, alpha);
    }
    for (let py = y + radius; py <= y + height - radius; py += 1) {
      setPixel(bitmap, x + inset, py, color, alpha);
      setPixel(bitmap, x + width - inset, py, color, alpha);
    }
    strokeArc(bitmap, x + radius, y + radius, radius - inset, Math.PI, Math.PI * 1.5, color, alpha);
    strokeArc(bitmap, x + width - radius, y + radius, radius - inset, Math.PI * 1.5, Math.PI * 2, color, alpha);
    strokeArc(bitmap, x + width - radius, y + height - radius, radius - inset, 0, Math.PI * 0.5, color, alpha);
    strokeArc(bitmap, x + radius, y + height - radius, radius - inset, Math.PI * 0.5, Math.PI, color, alpha);
  }
}

function strokeArc(bitmap, cx, cy, radius, start, end, color, alpha) {
  const steps = Math.max(8, Math.ceil(radius * 2));
  for (let step = 0; step <= steps; step += 1) {
    const angle = start + ((end - start) * step) / steps;
    setPixel(bitmap, Math.round(cx + Math.cos(angle) * radius), Math.round(cy + Math.sin(angle) * radius), color, alpha);
  }
}

function fillCircle(bitmap, cx, cy, radius, color, alpha) {
  const radiusSq = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        setPixel(bitmap, x, y, color, alpha);
      }
    }
  }
}

function drawGlyph(bitmap, glyph, cx, cy, color) {
  if (glyph === "+") {
    fillRect(bitmap, cx - 17, cy - 4, 34, 8, color, 1);
    fillRect(bitmap, cx - 4, cy - 17, 8, 34, color, 1);
    return;
  }
  if (glyph === "●") {
    fillCircle(bitmap, cx, cy, 18, color, 1);
    return;
  }
  if (glyph === "◎") {
    strokeCircle(bitmap, cx, cy, 20, color, 1, 5);
    fillCircle(bitmap, cx, cy, 5, color, 1);
    return;
  }
  if (glyph === "‹" || glyph === "›") {
    const direction = glyph === "‹" ? -1 : 1;
    drawThickLine(bitmap, cx + direction * 13, cy - 20, cx - direction * 11, cy, color, 5);
    drawThickLine(bitmap, cx - direction * 11, cy, cx + direction * 13, cy + 20, color, 5);
    return;
  }
  if (glyph === "↺" || glyph === "⟳") {
    strokeCircle(bitmap, cx, cy, 21, color, 1, 5);
    const sign = glyph === "↺" ? -1 : 1;
    fillTriangle(bitmap, cx + sign * -8, cy - 24, cx + sign * -26, cy - 25, cx + sign * -17, cy - 8, color, 1);
    return;
  }
  if (glyph === "▯") {
    strokeRoundedRect(bitmap, cx - 20, cy - 17, 40, 34, 6, color, 1, 5);
    return;
  }
  if (glyph === "⇅") {
    drawThickLine(bitmap, cx - 10, cy - 22, cx - 10, cy + 21, color, 4);
    fillTriangle(bitmap, cx - 10, cy - 31, cx - 21, cy - 15, cx + 1, cy - 15, color, 1);
    drawThickLine(bitmap, cx + 10, cy - 21, cx + 10, cy + 22, color, 4);
    fillTriangle(bitmap, cx + 10, cy + 31, cx - 1, cy + 15, cx + 21, cy + 15, color, 1);
    return;
  }
  if (glyph === "⇩" || glyph === "⇧") {
    const down = glyph === "⇩";
    const y1 = down ? cy - 25 : cy + 25;
    const y2 = down ? cy + 18 : cy - 18;
    drawThickLine(bitmap, cx, y1, cx, y2, color, 6);
    if (down) {
      fillTriangle(bitmap, cx, cy + 31, cx - 16, cy + 10, cx + 16, cy + 10, color, 1);
    } else {
      fillTriangle(bitmap, cx, cy - 31, cx - 16, cy - 10, cx + 16, cy - 10, color, 1);
    }
  }
}

function strokeCircle(bitmap, cx, cy, radius, color, alpha, thickness) {
  for (let t = 0; t < thickness; t += 1) {
    const r = radius - t;
    const steps = Math.ceil(r * Math.PI * 2);
    for (let step = 0; step < steps; step += 1) {
      const angle = (step / steps) * Math.PI * 2;
      setPixel(bitmap, Math.round(cx + Math.cos(angle) * r), Math.round(cy + Math.sin(angle) * r), color, alpha);
    }
  }
}

function drawText(bitmap, text, cx, y, scale, color, align = "left") {
  const chars = [...text].filter((char) => char !== " ");
  const width = chars.reduce((sum, char) => sum + ((font5x7[char]?.[0]?.length ?? 5) + 1) * scale, -scale);
  let x = align === "center" ? Math.round(cx - width / 2) : cx;
  [...text].forEach((char) => {
    if (char === " ") {
      x += 4 * scale;
      return;
    }
    const glyph = font5x7[char] ?? font5x7["?"];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, colIndex) => {
        if (pixel === "1") fillRect(bitmap, x + colIndex * scale, y + rowIndex * scale, scale, scale, color, 1);
      });
    });
    x += (glyph[0].length + 1) * scale;
  });
}

function drawThickLine(bitmap, x0, y0, x1, y1, color, thickness) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let step = 0; step <= steps; step += 1) {
    const amount = steps === 0 ? 0 : step / steps;
    const x = Math.round(x0 + (x1 - x0) * amount);
    const y = Math.round(y0 + (y1 - y0) * amount);
    fillCircle(bitmap, x, y, Math.ceil(thickness / 2), color, 1);
  }
}

function fillTriangle(bitmap, x1, y1, x2, y2, x3, y3, color, alpha) {
  const minX = Math.floor(Math.min(x1, x2, x3));
  const maxX = Math.ceil(Math.max(x1, x2, x3));
  const minY = Math.floor(Math.min(y1, y2, y3));
  const maxY = Math.ceil(Math.max(y1, y2, y3));
  const area = edge(x1, y1, x2, y2, x3, y3);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const w1 = edge(x2, y2, x3, y3, x, y);
      const w2 = edge(x3, y3, x1, y1, x, y);
      const w3 = edge(x1, y1, x2, y2, x, y);
      if ((area >= 0 && w1 >= 0 && w2 >= 0 && w3 >= 0) || (area < 0 && w1 <= 0 && w2 <= 0 && w3 <= 0)) {
        setPixel(bitmap, x, y, color, alpha);
      }
    }
  }
}

function edge(x1, y1, x2, y2, x, y) {
  return (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
}

function fillRect(bitmap, x, y, width, height, color, alpha) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      setPixel(bitmap, px, py, color, alpha);
    }
  }
}

function setPixel(bitmap, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= bitmap.width || y >= bitmap.height) return;
  const offset = (y * bitmap.width + x) * 4;
  const existingAlpha = bitmap.pixels[offset + 3] / 255;
  const nextAlpha = alpha + existingAlpha * (1 - alpha);
  const blend = nextAlpha === 0 ? 0 : alpha / nextAlpha;
  bitmap.pixels[offset] = Math.round(color.r * blend + bitmap.pixels[offset] * (1 - blend));
  bitmap.pixels[offset + 1] = Math.round(color.g * blend + bitmap.pixels[offset + 1] * (1 - blend));
  bitmap.pixels[offset + 2] = Math.round(color.b * blend + bitmap.pixels[offset + 2] * (1 - blend));
  bitmap.pixels[offset + 3] = Math.round(nextAlpha * 255);
}

function encodePng(bitmap) {
  const raw = Buffer.alloc((bitmap.width * 4 + 1) * bitmap.height);
  for (let y = 0; y < bitmap.height; y += 1) {
    const rowStart = y * (bitmap.width * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(bitmap.pixels.subarray(y * bitmap.width * 4, (y + 1) * bitmap.width * 4)).copy(raw, rowStart + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", Buffer.concat([uint32(bitmap.width), uint32(bitmap.height), Buffer.from([8, 6, 0, 0, 0])])),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc32(Buffer.concat([typeBuffer, data])))]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mixColor(first, second, amount) {
  return {
    r: Math.round(first.r + (second.r - first.r) * amount),
    g: Math.round(first.g + (second.g - first.g) * amount),
    b: Math.round(first.b + (second.b - first.b) * amount),
  };
}

async function createStreamDeckProfile(profileKeys) {
  const buildRoot = new URL("profile-build/", outputDir);
  const profileId = `${profileUuid}.sdProfile`;
  const pageUuid = "FE323234-1E64-42F2-B00A-96442712FC7F";
  const defaultPageUuid = "4C521C12-5B72-4EC0-8677-6C291F7C52F4";
  const profileRoot = new URL(`Profiles/${profileId}/`, buildRoot);
  const pageRoot = new URL(`Profiles/${pageUuid}/`, profileRoot);
  const defaultPageRoot = new URL(`Profiles/${defaultPageUuid}/`, profileRoot);
  const imagesRoot = new URL("Images/", pageRoot);
  const profileFile = new URL(profileFileName, outputDir);

  await rm(buildRoot, { recursive: true, force: true });
  await rm(profileFile, { force: true });
  await mkdir(imagesRoot, { recursive: true });
  await mkdir(new URL("Images/", profileRoot), { recursive: true });
  await mkdir(new URL("Images/", defaultPageRoot), { recursive: true });

  await Promise.all(
    profileKeys.map(async (key) => {
      await writeProfileIconPng(key, new URL(profileImageName(key), imagesRoot));
    }),
  );

  await writeFile(
    new URL("package.json", buildRoot),
    `${JSON.stringify(
      {
        AppVersion: "7.4.2.22730",
        DeviceModel: streamDeckMk2Model,
        DeviceSettings: null,
        FormatVersion: 1,
        OSType: "macOS",
        OSVersion: "26.5.0",
        RequiredPlugins: ["com.elgato.streamdeck.system.hotkey"],
      },
    )}\n`,
    "utf8",
  );

  const deviceUuid = randomUUID();
  await writeFile(
    new URL("manifest.json", profileRoot),
    `${JSON.stringify(
      {
        Device: {
          Model: streamDeckMk2Model,
          UUID: deviceUuid,
        },
        Name: profileName,
        Pages: {
          Current: "00000000-0000-0000-0000-000000000000",
          Default: defaultPageUuid.toLowerCase(),
          Pages: [pageUuid.toLowerCase()],
        },
        Version: "3.0",
      },
    )}\n`,
    "utf8",
  );

  await writeFile(
    new URL("manifest.json", defaultPageRoot),
    `${JSON.stringify({ Controllers: [{ Actions: null, Type: "Keypad" }], Icon: "", Name: "" })}\n`,
    "utf8",
  );

  await writeFile(
    new URL("manifest.json", pageRoot),
    `${JSON.stringify(
      {
        Controllers: [
          {
            Actions: Object.fromEntries(
              profileKeys.map((key) => [profileCoordinate(key.position), createProfileAction(key)]),
            ),
            Type: "Keypad",
          },
        ],
        Icon: "",
        Name: "",
      },
    )}\n`,
    "utf8",
  );

  await zip("zip", ["-qr", fileURLToPath(profileFile), "package.json", "Profiles"], { cwd: fileURLToPath(buildRoot) });
  await rm(buildRoot, { recursive: true, force: true });
}

function createProfileAction(key) {
  return {
    ActionID: randomUUID(),
    LinkedTitle: false,
    Name: "Hotkey",
    Plugin: {
      Name: "Activate a Key Command",
      UUID: "com.elgato.streamdeck.system.hotkey",
      Version: "1.0",
    },
    Resources: null,
    Settings: createHotkeySettings(key.profileKey ?? key.key),
    State: 0,
    States: [
      {
        FontFamily: "",
        FontSize: 12,
        FontStyle: "",
        FontUnderline: false,
        Image: `Images/${profileImageName(key)}`,
        OutlineThickness: 2,
        ShowTitle: false,
        Title: "",
        TitleAlignment: "bottom",
        TitleColor: "#ffffff",
      },
    ],
    UUID: "com.elgato.streamdeck.system.hotkey",
  };
}

function createHotkeySettings(key) {
  return {
    Coalesce: true,
    Hotkeys: [hotkeyDescriptor(key)],
  };
}

function hotkeyDescriptor(key) {
  const descriptor = hotkeyMap[key];
  if (!descriptor) {
    throw new Error(`Missing Stream Deck hotkey descriptor for ${key}`);
  }
  return {
    KeyCmd: false,
    KeyCtrl: false,
    KeyModifiers: 0,
    KeyOption: false,
    KeyShift: false,
    ...descriptor,
  };
}

function profileCoordinate({ row, column }) {
  return `${column - 1},${row - 1}`;
}

function profileImageName(key) {
  return key.file.replace(/\.svg$/u, ".png");
}

async function writeProfileIconPng(key, outputFile) {
  const sourceFile = new URL(key.file, outputDir);
  try {
    await zip("rsvg-convert", ["-w", "144", "-h", "144", "-o", fileURLToPath(outputFile), fileURLToPath(sourceFile)]);
  } catch {
    await writeFile(outputFile, createIconPng(key));
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
