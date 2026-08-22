import type * as THREE from "three";

type XrSessionControllerOptions = {
  onSessionStarted: (session: XRSession) => void;
  onSessionEnded: () => void;
  onSessionHidden: () => void;
  onReferenceSpaceReset: () => void;
};

export class XrSessionController {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly options: XrSessionControllerOptions,
  ) {}

  get isPresenting() {
    return this.session !== null;
  }

  async start() {
    if (this.session) return;
    if (!navigator.xr) throw new Error("WebXR is not available in this browser.");

    this.renderer.xr.setFramebufferScaleFactor(0.85);
    this.renderer.xr.setFoveation(0.5);
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "hand-tracking"],
    });

    const usesFloorSpace = session.enabledFeatures?.includes("local-floor") ?? false;
    this.renderer.xr.setReferenceSpaceType(usesFloorSpace ? "local-floor" : "local");
    session.addEventListener("end", this.onEnd);
    session.addEventListener("visibilitychange", this.onVisibilityChange);

    try {
      await this.renderer.xr.setSession(session);
      this.session = session;
      this.referenceSpace = this.renderer.xr.getReferenceSpace();
      this.referenceSpace?.addEventListener("reset", this.onReferenceSpaceReset);
      this.options.onSessionStarted(session);
    } catch (error) {
      session.removeEventListener("end", this.onEnd);
      session.removeEventListener("visibilitychange", this.onVisibilityChange);
      await session.end().catch(() => undefined);
      throw error;
    }
  }

  async end() {
    await this.session?.end();
  }

  dispose() {
    if (!this.session) return;
    this.session.removeEventListener("end", this.onEnd);
    this.session.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.referenceSpace?.removeEventListener("reset", this.onReferenceSpaceReset);
    this.referenceSpace = null;
    void this.session.end().catch(() => undefined);
    this.session = null;
  }

  private readonly onVisibilityChange = () => {
    if (this.session?.visibilityState !== "visible") this.options.onSessionHidden();
  };

  private readonly onReferenceSpaceReset = () => this.options.onReferenceSpaceReset();

  private readonly onEnd = () => {
    const endedSession = this.session;
    this.session = null;
    endedSession?.removeEventListener("end", this.onEnd);
    endedSession?.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.referenceSpace?.removeEventListener("reset", this.onReferenceSpaceReset);
    this.referenceSpace = null;
    this.options.onSessionEnded();
  };
}
