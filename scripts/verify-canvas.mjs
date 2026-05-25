import { chromium } from "playwright";
import { PNG } from "pngjs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const url = process.env.BLOCH_STEREO_URL ?? "http://127.0.0.1:5173/";
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector("canvas");
    await page.waitForTimeout(800);

    const bounds = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!(canvas instanceof HTMLCanvasElement)) {
        return { ok: false, reason: "canvas not found", width: 0, height: 0 };
      }
      const bounds = canvas.getBoundingClientRect();
      return {
        ok: bounds.width > 300 && bounds.height > 300,
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    });

    const screenshotPath = join(tmpdir(), `bloch-stereo-${viewport.name}.png`);
    const imageBuffer = await page.locator(".bloch-stage").screenshot({ path: screenshotPath });
    const image = PNG.sync.read(imageBuffer);
    const pixelResult = analyzePixels(image);
    await page.close();

    const result = { ...bounds, ...pixelResult, screenshotPath };
    if (!result.ok || !pixelResult.ok) {
      throw new Error(`${viewport.name} canvas check failed: ${JSON.stringify(result)}`);
    }
    console.log(`${viewport.name}: ${JSON.stringify(result)}`);
  }
} finally {
  await browser.close();
}

function analyzePixels(image) {
  let nonBackground = 0;
  let colorEnergy = 0;
  const stride = 8;

  for (let y = 0; y < image.height; y += stride) {
    for (let x = 0; x < image.width; x += stride) {
      const index = (image.width * y + x) * 4;
      const r = image.data[index];
      const g = image.data[index + 1];
      const b = image.data[index + 2];
      const brightness = r + g + b;
      const differsFromStage = Math.abs(r - 11) + Math.abs(g - 16) + Math.abs(b - 32);
      if (brightness > 70 && differsFromStage > 16) nonBackground += 1;
      colorEnergy += Math.abs(r - g) + Math.abs(g - b);
    }
  }

  return {
    ok: nonBackground > 80 && colorEnergy > 1000,
    nonBackground,
    colorEnergy,
  };
}
