import * as THREE from "three";
import type { BlochSceneContent } from "../stereo/BlochSceneContent";
import { XrControlPanel, type XrPanelAction, type XrPanelState } from "./XrControlPanel";
import { XrInteraction } from "./XrInteraction";
import { XrQualityController, type XrQualityLevel } from "./XrQualityController";

export type XrSceneActions = {
  previousStep: () => void;
  nextStep: () => void;
  reset: () => void;
  toggleAutoplay: () => void;
  stopAutoplay: () => void;
  cyclePreset: () => void;
  cyclePair: () => void;
  exitXr: () => void;
};

export class XrScene {
  private readonly anchor = new THREE.Group();
  private readonly contentTransform = new THREE.Group();
  private readonly panel = new XrControlPanel();
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraDirection = new THREE.Vector3();
  private readonly quality: XrQualityController;
  private interaction: XrInteraction | null = null;
  private panelState: XrPanelState;
  private active = false;
  private recenterPending = false;
  private recenterDelayFrames = 0;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly content: BlochSceneContent,
    private readonly actions: XrSceneActions,
    initialState: XrPanelState,
  ) {
    this.panelState = initialState;
    this.contentTransform.add(content.root);
    this.anchor.add(this.contentTransform, this.panel.root);
    this.scene.add(this.anchor);
    this.panel.root.visible = false;
    this.panel.update(initialState);
    this.quality = new XrQualityController(renderer, content, (level) => this.setQualityLabel(level));
  }

  setPanelState(state: XrPanelState) {
    this.panelState = { ...state, qualityLabel: this.panelState.qualityLabel };
    this.panel.update(this.panelState);
  }

  startSession() {
    this.active = true;
    this.recenterPending = true;
    this.recenterDelayFrames = 1;
    this.contentTransform.rotation.set(-Math.PI / 2, 0, 0);
    this.contentTransform.scale.setScalar(0.18);
    this.panel.root.position.set(0, -0.55, 0.12);
    this.panel.root.visible = true;
    this.interaction = new XrInteraction(this.renderer, this.scene, this.panel, this.handleAction);
    this.quality.reset();
  }

  endSession() {
    this.active = false;
    this.recenterPending = false;
    this.recenterDelayFrames = 0;
    this.interaction?.dispose();
    this.interaction = null;
    this.panel.root.visible = false;
    this.anchor.position.set(0, 0, 0);
    this.anchor.rotation.set(0, 0, 0);
    this.contentTransform.rotation.set(0, 0, 0);
    this.contentTransform.scale.setScalar(1);
    this.content.setDecorativeDetailsVisible(true);
    this.quality.reset();
  }

  update(time: number) {
    if (!this.active) return;
    if (this.recenterPending && this.renderer.xr.isPresenting) {
      if (this.recenterDelayFrames > 0) {
        this.recenterDelayFrames -= 1;
      } else {
        this.recenter();
        this.recenterPending = false;
      }
    }
    this.interaction?.update();
    this.quality.update(time);
  }

  requestRecenter() {
    this.recenterPending = true;
    this.recenterDelayFrames = 0;
  }

  dispose() {
    this.endSession();
    this.contentTransform.remove(this.content.root);
    this.scene.remove(this.anchor);
    this.panel.dispose();
  }

  private readonly handleAction = (action: XrPanelAction) => {
    if (action === "previous-step") this.actions.previousStep();
    else if (action === "next-step") this.actions.nextStep();
    else if (action === "reset") this.actions.reset();
    else if (action === "toggle-autoplay") this.actions.toggleAutoplay();
    else if (action === "cycle-preset") this.actions.cyclePreset();
    else if (action === "cycle-pair") this.actions.cyclePair();
    else if (action === "recenter") this.recenter();
    else if (action === "exit-xr") this.actions.exitXr();
  };

  private recenter() {
    const xrCamera = this.renderer.xr.getCamera();
    xrCamera.getWorldPosition(this.cameraPosition);
    xrCamera.getWorldDirection(this.cameraDirection);
    this.cameraDirection.y = 0;
    if (this.cameraDirection.lengthSq() < 1e-6) this.cameraDirection.set(0, 0, -1);
    this.cameraDirection.normalize();

    this.anchor.position.copy(this.cameraPosition).addScaledVector(this.cameraDirection, 1.7);
    this.anchor.position.y = this.cameraPosition.y - 0.1;
    this.anchor.rotation.set(0, Math.atan2(-this.cameraDirection.x, -this.cameraDirection.z), 0);
  }

  private setQualityLabel(level: XrQualityLevel) {
    this.panelState = { ...this.panelState, qualityLabel: level === "standard" ? "Quality: standard" : "Quality: reduced" };
    this.panel.update(this.panelState);
  }
}
