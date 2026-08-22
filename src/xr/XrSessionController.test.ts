import { afterEach, describe, expect, it, vi } from "vitest";
import type * as THREE from "three";
import { XrSessionController } from "./XrSessionController";

class FakeSession extends EventTarget {
  enabledFeatures = ["local-floor", "hand-tracking"];
  visibilityState: XRVisibilityState = "visible";

  async end() {
    this.dispatchEvent(new Event("end"));
  }
}

describe("XrSessionController", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("configures, starts, pauses, and ends an immersive session", async () => {
    const session = new FakeSession();
    const referenceSpace = new EventTarget();
    const xrSystem = { requestSession: vi.fn().mockResolvedValue(session) };
    vi.stubGlobal("navigator", { xr: xrSystem });
    const xrManager = {
      setFramebufferScaleFactor: vi.fn(),
      setFoveation: vi.fn(),
      setReferenceSpaceType: vi.fn(),
      setSession: vi.fn().mockResolvedValue(undefined),
      getReferenceSpace: vi.fn().mockReturnValue(referenceSpace),
    };
    const renderer = { xr: xrManager } as unknown as THREE.WebGLRenderer;
    const onSessionStarted = vi.fn();
    const onSessionEnded = vi.fn();
    const onSessionHidden = vi.fn();
    const onReferenceSpaceReset = vi.fn();
    const controller = new XrSessionController(renderer, {
      onSessionStarted,
      onSessionEnded,
      onSessionHidden,
      onReferenceSpaceReset,
    });

    await controller.start();
    expect(xrSystem.requestSession).toHaveBeenCalledWith("immersive-vr", {
      optionalFeatures: ["local-floor", "hand-tracking"],
    });
    expect(xrManager.setReferenceSpaceType).toHaveBeenCalledWith("local-floor");
    expect(onSessionStarted).toHaveBeenCalledWith(session);

    session.visibilityState = "visible-blurred";
    session.dispatchEvent(new Event("visibilitychange"));
    expect(onSessionHidden).toHaveBeenCalledOnce();

    referenceSpace.dispatchEvent(new Event("reset"));
    expect(onReferenceSpaceReset).toHaveBeenCalledOnce();

    await controller.end();
    expect(onSessionEnded).toHaveBeenCalledOnce();
    expect(controller.isPresenting).toBe(false);
  });
});
