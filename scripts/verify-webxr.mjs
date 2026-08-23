import { chromium } from "playwright";
import { PNG } from "pngjs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const baseUrl = process.env.BLOCH_STEREO_URL ?? "http://127.0.0.1:5173/";
const url = new URL(baseUrl);
url.searchParams.set("emulate-xr", "1");
const browser = await chromium.launch();
const xrTargets = {
  next: { x: -0.263, y: 2.21, z: -1.58 },
  loop: { x: 0.101, y: 2.21, z: -1.58 },
  twoD: { x: 0.48, y: 2.21, z: -1.58 },
  circuitEditor: { x: 0.698, y: 2.21, z: -1.58 },
  top: { x: -0.198, y: 2.01, z: -1.58 },
  view: { x: -0.02, y: 2.01, z: -1.58 },
  pair02: { x: 0.96, y: 1.715, z: -1.58 },
};

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
  await page.getByText("VR ready", { exact: true }).waitFor({ timeout: 5000 });

  const emulationReady = await page.evaluate(() => Boolean(window.__BLOCH_XR_DEVICE__ && navigator.xr));
  if (!emulationReady) throw new Error("IWER Meta Quest emulation did not initialize.");

  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await waitForXrSession(page, true);
  await page.locator(".screen-visualization").waitFor();
  await page.waitForTimeout(350);
  const screenshotPath = join(tmpdir(), "bloch-stereo-webxr-emulated.png");
  const introFrame = await page.screenshot({ path: screenshotPath });
  await page.waitForTimeout(900);
  const laterIntroFrame = await page.screenshot();
  const introChangedPixelRatio = changedPixelRatio(introFrame, laterIntroFrame);
  if (introChangedPixelRatio < 0.002) {
    throw new Error(`XR intro orbit did not produce a visible change (${introChangedPixelRatio}).`);
  }

  await aimAndTrigger(page, xrTargets.circuitEditor);
  await waitForXrSession(page, false);
  await page.locator(".editor-workspace").waitFor();
  await page.locator(".preset-field select").selectOption("bell");
  await page.getByRole("button", { name: "Bloch View", exact: true }).click();
  await waitForXrSession(page, true);
  await page.locator("main.screen-visualization").waitFor();

  const initialStep = await readStep(page);
  await aimAndTrigger(page, xrTargets.next);
  await page.waitForFunction((step) => Number(document.querySelector(".step-counter b")?.textContent) > step, initialStep);
  const advancedStep = await readStep(page);
  const circuitScreenshotPath = join(tmpdir(), "bloch-stereo-webxr-circuit-emulated.png");
  await page.screenshot({ path: circuitScreenshotPath });

  await aimAndTrigger(page, xrTargets.loop);
  await page.waitForFunction(() => document.querySelector('button[title="Loop autoplay"]')?.classList.contains("is-active"));
  await aimAndTrigger(page, xrTargets.loop);
  await page.waitForFunction(() => !document.querySelector('button[title="Loop autoplay"]')?.classList.contains("is-active"));
  await aimAndTrigger(page, xrTargets.top);
  await page.waitForTimeout(300);
  await aimAndTrigger(page, xrTargets.view);
  await page.waitForTimeout(300);

  const dragStart = { x: 0, y: 1.55, z: -1.58 };
  const beforeRightDrag = await page.screenshot();
  await dragPointer(page, "right", dragStart, { x: 0.32, y: 1.66, z: -1.58 });
  const afterRightDrag = await page.screenshot();
  const rightPointerRotationChangedPixelRatio = changedPixelRatio(beforeRightDrag, afterRightDrag);
  if (rightPointerRotationChangedPixelRatio < 0.001) {
    throw new Error(`Right XR pointer drag did not rotate the view (${rightPointerRotationChangedPixelRatio}).`);
  }
  const beforeLeftDrag = afterRightDrag;
  await dragPointer(page, "left", dragStart, { x: -0.3, y: 1.48, z: -1.58 });
  const afterLeftDrag = await page.screenshot();
  const leftPointerRotationChangedPixelRatio = changedPixelRatio(beforeLeftDrag, afterLeftDrag);
  if (leftPointerRotationChangedPixelRatio < 0.001) {
    throw new Error(`Left XR pointer drag did not rotate the view (${leftPointerRotationChangedPixelRatio}).`);
  }
  const beforeRightZoom = afterLeftDrag;
  await driveThumbstick(page, "right", 0, -0.85);
  const afterRightZoom = await page.screenshot();
  const rightControllerZoomChangedPixelRatio = changedPixelRatio(beforeRightZoom, afterRightZoom);
  if (rightControllerZoomChangedPixelRatio < 0.001) {
    throw new Error(`Right XR controller zoom did not produce a visible change (${rightControllerZoomChangedPixelRatio}).`);
  }
  const beforeLeftZoom = afterRightZoom;
  await driveThumbstick(page, "left", 0, 0.85);
  const afterLeftZoom = await page.screenshot();
  const leftControllerZoomChangedPixelRatio = changedPixelRatio(beforeLeftZoom, afterLeftZoom);
  if (leftControllerZoomChangedPixelRatio < 0.001) {
    throw new Error(`Left XR controller zoom did not produce a visible change (${leftControllerZoomChangedPixelRatio}).`);
  }

  await aimAndTrigger(page, xrTargets.twoD);
  await waitForXrSession(page, false);
  await page.getByRole("button", { name: "Circuit Editor", exact: true }).click();
  await page.locator(".editor-workspace").waitFor();
  await page.getByRole("button", { name: "Bloch View", exact: true }).click();
  await page.waitForTimeout(250);
  if (await isXrSessionActive(page)) throw new Error("Bloch View did not preserve 2D mode after leaving the editor.");
  await page.getByRole("button", { name: "VR", exact: true }).click();
  await waitForXrSession(page, true);
  await aimAndTrigger(page, xrTargets.circuitEditor);
  await waitForXrSession(page, false);
  await page.locator(".editor-workspace").waitFor();
  await page.getByRole("button", { name: "Bloch View", exact: true }).click();
  await waitForXrSession(page, true);
  await aimAndTrigger(page, xrTargets.twoD);
  await waitForXrSession(page, false);

  await page.getByRole("button", { name: "Circuit Editor", exact: true }).click();
  await page.locator(".editor-workspace").waitFor();
  await page.locator(".preset-field select").selectOption("ghz");
  await page.getByRole("button", { name: "Bloch View", exact: true }).click();
  await page.waitForTimeout(250);
  if (await isXrSessionActive(page)) throw new Error("GHZ editor return unexpectedly left 2D mode.");
  await page.getByRole("button", { name: "VR", exact: true }).click();
  await waitForXrSession(page, true);
  await aimAndTrigger(page, xrTargets.pair02);
  await page.waitForFunction(() => document.querySelector(".correlation-pair-selector button:nth-child(2)")?.classList.contains("is-active"));
  const correlationScreenshotPath = join(tmpdir(), "bloch-stereo-webxr-correlation-emulated.png");
  await page.screenshot({ path: correlationScreenshotPath });

  await page.waitForTimeout(300);
  const beforePinchStep = await readStep(page);
  await aimAndPinch(page, xrTargets.next);
  await page.waitForFunction((step) => Number(document.querySelector(".step-counter b")?.textContent) > step, beforePinchStep);
  await aimAndTrigger(page, xrTargets.twoD);
  await waitForXrSession(page, false);

  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`WebXR errors: ${[...pageErrors, ...consoleErrors].join(" | ")}`);
  }
  console.log(JSON.stringify({
    ok: true,
    initialStep,
    advancedStep,
    introChangedPixelRatio,
    controllerInput: true,
    handPinchInput: true,
    loopControl: true,
    viewControls: true,
    rightPointerRotationChangedPixelRatio,
    leftPointerRotationChangedPixelRatio,
    rightControllerZoomChangedPixelRatio,
    leftControllerZoomChangedPixelRatio,
    correlationSelector: true,
    editorModeRetention: true,
    repeatedEntryCount: 5,
    screenshotPath,
    circuitScreenshotPath,
    correlationScreenshotPath,
    url: url.toString(),
  }));
} finally {
  await browser.close();
}

async function readStep(page) {
  return Number(await page.locator(".step-counter b").textContent());
}

async function waitForXrSession(page, active) {
  await page.waitForFunction(
    (expected) => Boolean(window.__BLOCH_XR_DEVICE__?.activeSession) === expected,
    active,
  );
}

async function isXrSessionActive(page) {
  return page.evaluate(() => Boolean(window.__BLOCH_XR_DEVICE__?.activeSession));
}

function changedPixelRatio(first, second) {
  const firstImage = PNG.sync.read(first);
  const secondImage = PNG.sync.read(second);
  if (firstImage.width !== secondImage.width || firstImage.height !== secondImage.height) return 1;
  let changedPixels = 0;
  for (let index = 0; index < firstImage.data.length; index += 4) {
    const difference = Math.abs(firstImage.data[index] - secondImage.data[index])
      + Math.abs(firstImage.data[index + 1] - secondImage.data[index + 1])
      + Math.abs(firstImage.data[index + 2] - secondImage.data[index + 2]);
    if (difference > 36) changedPixels += 1;
  }
  return changedPixels / (firstImage.width * firstImage.height);
}

async function aimAndTrigger(page, target) {
  await aimController(page, "right", target);
  await page.waitForTimeout(120);
  await page.evaluate(() => window.__BLOCH_XR_DEVICE__?.controllers.right?.updateButtonValue("trigger", 1));
  await page.waitForTimeout(60);
  await page.evaluate(() => window.__BLOCH_XR_DEVICE__?.controllers.right?.updateButtonValue("trigger", 0));
  await page.waitForTimeout(180);
}

async function aimController(page, handedness, target) {
  await page.evaluate(({ x, y, z, handedness: hand }) => {
    const device = window.__BLOCH_XR_DEVICE__;
    const controller = device?.controllers[hand];
    if (!device || !controller) throw new Error(`${hand} Touch Plus controller is unavailable.`);
    device.primaryInputMode = "controller";
    controller.connected = true;
    const origin = { x: hand === "left" ? -0.24 : 0.24, y: 1.2, z: -0.45 };
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
  }, { ...target, handedness });
}

async function dragPointer(page, handedness, from, to) {
  await aimController(page, handedness, from);
  await page.waitForTimeout(120);
  await page.evaluate((hand) => window.__BLOCH_XR_DEVICE__?.controllers[hand]?.updateButtonValue("trigger", 1), handedness);
  await page.waitForTimeout(100);
  for (let step = 1; step <= 8; step += 1) {
    const progress = step / 8;
    await aimController(page, handedness, {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      z: from.z + (to.z - from.z) * progress,
    });
    await page.waitForTimeout(45);
  }
  await page.evaluate((hand) => window.__BLOCH_XR_DEVICE__?.controllers[hand]?.updateButtonValue("trigger", 0), handedness);
  await page.waitForTimeout(240);
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

async function driveThumbstick(page, handedness, x, y) {
  await page.evaluate(({ handedness: hand, x: axisX, y: axisY }) => {
    const device = window.__BLOCH_XR_DEVICE__;
    const controller = device?.controllers[hand];
    if (!device || !controller) throw new Error(`${hand} Touch Plus controller is unavailable.`);
    device.primaryInputMode = "controller";
    controller.connected = true;
    controller.updateAxes("thumbstick", axisX, axisY);
  }, { handedness, x, y });
  await page.waitForTimeout(520);
  await page.evaluate((hand) => window.__BLOCH_XR_DEVICE__?.controllers[hand]?.updateAxes("thumbstick", 0, 0), handedness);
  await page.waitForTimeout(180);
}
