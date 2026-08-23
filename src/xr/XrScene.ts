import * as THREE from "three";
import type { Circuit } from "../circuit/types";
import type { BlochSceneContent } from "../stereo/BlochSceneContent";
import { XrCircuitPanel } from "./XrCircuitPanel";
import { XrCorrelationPanel, type XrCorrelationState } from "./XrCorrelationPanel";
import { XrControlPanel, type XrPanelAction, type XrPanelState } from "./XrControlPanel";
import { XrInteraction } from "./XrInteraction";
import { XrPurityPanel, type XrPurityValue } from "./XrPurityPanel";
import { XrQualityController } from "./XrQualityController";

const INTRO_ORBIT_DURATION_MS = 3200;

export type XrSceneActions = {
  previousStep: () => void;
  nextStep: () => void;
  reset: () => void;
  toggleAutoplay: () => void;
  toggleLoop: () => void;
  stopAutoplay: () => void;
  show2d: () => void;
  openEditor: () => void;
  selectCorrelationPair: (pair: [number, number]) => void;
};

export class XrScene {
  private readonly anchor = new THREE.Group();
  private readonly contentTransform = new THREE.Group();
  private readonly contentOrbit = new THREE.Group();
  private readonly panel = new XrControlPanel();
  private readonly circuitPanel: XrCircuitPanel;
  private readonly correlationPanel: XrCorrelationPanel;
  private readonly purityPanel: XrPurityPanel;
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraDirection = new THREE.Vector3();
  private readonly quality: XrQualityController;
  private interaction: XrInteraction | null = null;
  private panelState: XrPanelState;
  private active = false;
  private recenterPending = false;
  private recenterDelayFrames = 0;
  private introStartedAt = 0;
  private introActive = false;
  private targetContentPitch = -Math.PI / 2;
  private targetContentYaw = 0;
  private targetContentScale = 0.18;
  private previousUpdateTime = 0;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly content: BlochSceneContent,
    private readonly actions: XrSceneActions,
    initialState: XrPanelState,
    initialCircuit: Circuit,
    initialStep: number,
    initialPurities: XrPurityValue[],
    initialCorrelation: XrCorrelationState,
  ) {
    this.panelState = initialState;
    this.circuitPanel = new XrCircuitPanel(initialCircuit, initialStep);
    this.correlationPanel = new XrCorrelationPanel(initialCorrelation);
    this.purityPanel = new XrPurityPanel(initialPurities);
    this.contentOrbit.add(content.root);
    this.contentTransform.add(this.contentOrbit);
    this.anchor.add(
      this.contentTransform,
      this.panel.root,
      this.purityPanel.root,
      this.correlationPanel.root,
      this.circuitPanel.root,
    );
    this.scene.add(this.anchor);
    this.panel.root.visible = false;
    this.purityPanel.root.visible = false;
    this.correlationPanel.setSessionVisible(false);
    this.circuitPanel.root.visible = false;
    this.panel.update(initialState);
    this.quality = new XrQualityController(renderer, content, () => undefined);
  }

  setPanelState(state: XrPanelState) {
    this.panelState = state;
    this.panel.update(this.panelState);
  }

  setCircuit(circuit: Circuit, currentStep: number) {
    this.circuitPanel.update(circuit, currentStep);
  }

  setPurities(values: XrPurityValue[]) {
    this.purityPanel.update(values);
  }

  setCorrelation(state: XrCorrelationState) {
    this.correlationPanel.update(state);
  }

  startSession(playIntroOrbit = false) {
    this.active = true;
    this.recenterPending = true;
    this.recenterDelayFrames = 1;
    this.contentTransform.rotation.set(-Math.PI / 2, 0, 0);
    this.targetContentPitch = -Math.PI / 2;
    this.targetContentYaw = 0;
    this.targetContentScale = 0.18;
    this.contentTransform.scale.setScalar(0.18);
    this.contentOrbit.rotation.set(0, 0, playIntroOrbit ? -Math.PI * 2 : 0);
    this.introStartedAt = performance.now();
    this.introActive = playIntroOrbit;
    this.previousUpdateTime = 0;
    this.panel.root.position.set(0, 0.65, 0.12);
    this.purityPanel.root.position.set(0, -0.245, 0.12);
    this.correlationPanel.root.position.set(0.96, -0.02, 0.12);
    this.circuitPanel.root.position.set(0, -0.55, 0.12);
    this.panel.root.visible = true;
    this.purityPanel.root.visible = true;
    this.correlationPanel.setSessionVisible(true);
    this.circuitPanel.root.visible = true;
    this.interaction = new XrInteraction(
      this.renderer,
      this.scene,
      [this.panel, this.correlationPanel],
      this.handleAction,
    );
    this.quality.reset();
  }

  endSession() {
    this.active = false;
    this.recenterPending = false;
    this.recenterDelayFrames = 0;
    this.introActive = false;
    this.interaction?.dispose();
    this.interaction = null;
    this.panel.root.visible = false;
    this.purityPanel.root.visible = false;
    this.correlationPanel.setSessionVisible(false);
    this.circuitPanel.root.visible = false;
    this.anchor.position.set(0, 0, 0);
    this.anchor.rotation.set(0, 0, 0);
    this.contentTransform.rotation.set(0, 0, 0);
    this.targetContentPitch = 0;
    this.targetContentYaw = 0;
    this.targetContentScale = 1;
    this.contentTransform.scale.setScalar(1);
    this.contentOrbit.rotation.set(0, 0, 0);
    this.content.setDecorativeDetailsVisible(true);
    this.quality.reset();
  }

  update(time: number) {
    if (!this.active) return;
    const deltaSeconds = this.previousUpdateTime === 0 ? 0 : Math.min(0.1, (time - this.previousUpdateTime) / 1000);
    this.previousUpdateTime = time;
    if (this.recenterPending && this.renderer.xr.isPresenting) {
      if (this.recenterDelayFrames > 0) {
        this.recenterDelayFrames -= 1;
      } else {
        this.recenter();
        this.recenterPending = false;
      }
    }
    if (this.introActive) {
      const progress = clamp((time - this.introStartedAt) / INTRO_ORBIT_DURATION_MS, 0, 1);
      const eased = easeInOutCubic(progress);
      this.contentOrbit.rotation.z = -Math.PI * 2 * (1 - eased);
      if (progress >= 1) {
        this.contentOrbit.rotation.z = 0;
        this.introActive = false;
      }
    }
    const navigation = this.interaction?.update();
    if (navigation) this.applyNavigation(navigation, deltaSeconds);
    const viewBlend = 1 - Math.exp(-8 * deltaSeconds);
    this.contentTransform.rotation.x += (this.targetContentPitch - this.contentTransform.rotation.x) * viewBlend;
    this.contentTransform.rotation.y += shortestAngleDelta(this.contentTransform.rotation.y, this.targetContentYaw) * viewBlend;
    const currentScale = this.contentTransform.scale.x;
    this.contentTransform.scale.setScalar(currentScale + (this.targetContentScale - currentScale) * viewBlend);
    this.quality.update(time);
  }

  requestRecenter() {
    this.recenterPending = true;
    this.recenterDelayFrames = 0;
  }

  dispose() {
    this.endSession();
    this.contentOrbit.remove(this.content.root);
    this.scene.remove(this.anchor);
    this.panel.dispose();
    this.purityPanel.dispose();
    this.correlationPanel.dispose();
    this.circuitPanel.dispose();
  }

  private readonly handleAction = (action: XrPanelAction) => {
    if (action === "previous-step") this.actions.previousStep();
    else if (action === "next-step") this.actions.nextStep();
    else if (action === "reset") this.actions.reset();
    else if (action === "toggle-autoplay") this.actions.toggleAutoplay();
    else if (action === "toggle-loop") this.actions.toggleLoop();
    else if (action === "show-2d") this.actions.show2d();
    else if (action === "open-editor") this.actions.openEditor();
    else if (action === "view-top") this.setViewPitch(0);
    else if (action === "view-default") this.setViewPitch(-Math.PI / 2);
    else if (action === "view-bottom") this.setViewPitch(-Math.PI);
    else if (action === "select-pair-01") this.actions.selectCorrelationPair([0, 1]);
    else if (action === "select-pair-02") this.actions.selectCorrelationPair([0, 2]);
    else if (action === "select-pair-12") this.actions.selectCorrelationPair([1, 2]);
  };

  private setViewPitch(pitch: number) {
    this.targetContentPitch = pitch;
    this.targetContentYaw = 0;
    if (pitch === -Math.PI / 2) this.targetContentScale = 0.18;
    this.introActive = false;
    this.contentOrbit.rotation.z = 0;
  }

  private applyNavigation(
    navigation: { rotationYawDelta: number; rotationPitchDelta: number; zoom: number },
    deltaSeconds: number,
  ) {
    if (Math.abs(navigation.rotationYawDelta) + Math.abs(navigation.rotationPitchDelta) + Math.abs(navigation.zoom) < 1e-4) return;
    this.introActive = false;
    this.contentOrbit.rotation.z = 0;
    this.targetContentYaw += navigation.rotationYawDelta;
    this.targetContentPitch = clamp(
      this.targetContentPitch - navigation.rotationPitchDelta,
      -Math.PI,
      0,
    );
    this.targetContentScale = clamp(
      this.targetContentScale * Math.exp(-navigation.zoom * deltaSeconds * 1.45),
      0.11,
      0.3,
    );
  }

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

}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shortestAngleDelta(current: number, target: number): number {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}
