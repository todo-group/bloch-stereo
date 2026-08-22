import { chromium } from "playwright";
import { join } from "node:path";
import { tmpdir } from "node:os";

const baseUrl = process.env.BLOCH_STEREO_URL ?? "http://127.0.0.1:5173/";
const url = new URL(baseUrl);
url.searchParams.set("emulate-xr", "1");
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.text().includes("Can't change size while VR device is presenting")) {
      consoleErrors.push(message.text());
    }
  });
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.locator(".xr-entry-control").waitFor();
  try {
    await page.getByTitle("Enter immersive VR").waitFor({ timeout: 5000 });
  } catch {
    const status = await page.locator(".xr-entry-control").textContent();
    const diagnostics = await page.evaluate(async () => ({
      hasDevice: Boolean(window.__BLOCH_XR_DEVICE__),
      hasXr: Boolean(navigator.xr),
      supportedModes: window.__BLOCH_XR_DEVICE__?.supportedSessionModes,
      immersiveVr: navigator.xr ? await navigator.xr.isSessionSupported("immersive-vr") : false,
    }));
    throw new Error(
      `Enter VR did not become available. Status: ${status}. Diagnostics: ${JSON.stringify(diagnostics)}. Page errors: ${pageErrors.join(" | ")}`,
    );
  }

  const emulationReady = await page.evaluate(() => Boolean(window.__BLOCH_XR_DEVICE__ && navigator.xr));
  if (!emulationReady) throw new Error("IWER Meta Quest emulation did not initialize.");

  await page.getByTitle("Enter immersive VR").click();
  await page.getByRole("button", { name: "VR active" }).waitFor();
  await page.waitForTimeout(500);
  const screenshotPath = join(tmpdir(), "bloch-stereo-webxr-emulated.png");
  await page.screenshot({ path: screenshotPath });

  const initialStep = await readStep(page);
  await aimAndTrigger(page, { x: -0.12, y: 0.99, z: -1.58 });
  await page.waitForFunction((step) => Number(document.querySelector(".step-counter span")?.textContent) > step, initialStep);
  const advancedStep = await readStep(page);

  await aimAndTrigger(page, { x: 0.57, y: 0.99, z: -1.58 });
  await page.getByTitle("Enter immersive VR").waitFor();

  for (let entry = 2; entry < 5; entry += 1) {
    await page.getByTitle("Enter immersive VR").click();
    await page.getByRole("button", { name: "VR active" }).waitFor();
    await page.waitForTimeout(180);
    await aimAndTrigger(page, { x: 0.57, y: 0.99, z: -1.58 });
    await page.getByTitle("Enter immersive VR").waitFor();
  }

  await page.getByTitle("Enter immersive VR").click();
  await page.getByRole("button", { name: "VR active" }).waitFor();
  await page.waitForTimeout(300);
  const beforePinchStep = await readStep(page);
  await aimAndPinch(page, { x: -0.12, y: 0.99, z: -1.58 });
  await page.waitForFunction((step) => Number(document.querySelector(".step-counter span")?.textContent) > step, beforePinchStep);
  await aimAndTrigger(page, { x: 0.57, y: 0.99, z: -1.58 });
  await page.getByTitle("Enter immersive VR").waitFor();

  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`WebXR errors: ${[...pageErrors, ...consoleErrors].join(" | ")}`);
  }
  console.log(JSON.stringify({ ok: true, initialStep, advancedStep, controllerInput: true, handPinchInput: true, repeatedEntryCount: 5, screenshotPath, url: url.toString() }));
} finally {
  await browser.close();
}

async function readStep(page) {
  return Number(await page.locator(".step-counter span").textContent());
}

async function aimAndTrigger(page, target) {
  await page.evaluate(({ x, y, z }) => {
    const device = window.__BLOCH_XR_DEVICE__;
    const controller = device?.controllers.right;
    if (!device || !controller) throw new Error("Right Touch Plus controller is unavailable.");
    device.primaryInputMode = "controller";
    controller.connected = true;
    const origin = { x: 0.24, y: 1.2, z: -0.45 };
    controller.position.set(origin.x, origin.y, origin.z);
    const dx = x - origin.x;
    const dy = y - origin.y;
    const dz = z - origin.z;
    const inverseLength = 1 / Math.hypot(dx, dy, dz);
    const direction = { x: dx * inverseLength, y: dy * inverseLength, z: dz * inverseLength };
    const qx = direction.y;
    const qy = -direction.x;
    const qz = 0;
    const qw = 1 - direction.z;
    const inverseQuaternionLength = 1 / Math.hypot(qx, qy, qz, qw);
    controller.quaternion.set(
      qx * inverseQuaternionLength,
      qy * inverseQuaternionLength,
      qz,
      qw * inverseQuaternionLength,
    );
  }, target);
  await page.waitForTimeout(120);
  await page.evaluate(() => window.__BLOCH_XR_DEVICE__?.controllers.right?.updateButtonValue("trigger", 1));
  await page.waitForTimeout(60);
  await page.evaluate(() => window.__BLOCH_XR_DEVICE__?.controllers.right?.updateButtonValue("trigger", 0));
  await page.waitForTimeout(180);
}

async function aimAndPinch(page, target) {
  await page.evaluate(({ x, y, z }) => {
    const device = window.__BLOCH_XR_DEVICE__;
    const hand = device?.hands.right;
    if (!device || !hand) throw new Error("Right hand emulation is unavailable.");
    device.primaryInputMode = "hand";
    hand.connected = true;
    const origin = { x: 0.18, y: 1.2, z: -0.45 };
    hand.position.set(origin.x, origin.y, origin.z);
    const dx = x - origin.x;
    const dy = y - origin.y;
    const dz = z - origin.z;
    const inverseLength = 1 / Math.hypot(dx, dy, dz);
    const direction = { x: dx * inverseLength, y: dy * inverseLength, z: dz * inverseLength };
    const qx = direction.y;
    const qy = -direction.x;
    const qw = 1 - direction.z;
    const inverseQuaternionLength = 1 / Math.hypot(qx, qy, qw);
    hand.quaternion.set(qx * inverseQuaternionLength, qy * inverseQuaternionLength, 0, qw * inverseQuaternionLength);
  }, target);
  await page.waitForTimeout(120);
  await page.evaluate(() => window.__BLOCH_XR_DEVICE__?.hands.right?.updatePinchValue(1));
  await page.waitForTimeout(60);
  await page.evaluate(() => window.__BLOCH_XR_DEVICE__?.hands.right?.updatePinchValue(0));
  await page.waitForTimeout(180);
}
