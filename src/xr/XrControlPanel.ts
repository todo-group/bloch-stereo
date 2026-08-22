import * as THREE from "three";

export type XrPanelAction =
  | "previous-step"
  | "toggle-autoplay"
  | "next-step"
  | "reset"
  | "recenter"
  | "exit-xr"
  | "cycle-preset"
  | "cycle-qubits"
  | "cycle-pair";

export type XrPanelState = {
  step: number;
  totalSteps: number;
  canPrevious: boolean;
  canNext: boolean;
  canSelectPair: boolean;
  autoplay: boolean;
  activeOperation: string;
  presetLabel: string;
  qubitsLabel: string;
  pairLabel: string;
  classicalLabel: string;
  correlationLabel: string;
  qualityLabel: string;
};

type XrPanelButton = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  action: XrPanelAction;
  label: string;
};

export class XrControlPanel {
  readonly root = new THREE.Group();
  readonly targets: THREE.Object3D[] = [];

  private readonly buttons = new Map<XrPanelAction, XrPanelButton>();
  private readonly status: ReturnType<typeof createPanelSurface>;
  private readonly details: ReturnType<typeof createPanelSurface>;

  constructor() {
    const backing = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x07101f, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
    );
    backing.position.set(0, -0.08, -0.025);
    this.root.add(backing);

    this.status = createPanelSurface(1.28, 0.12, false);
    this.status.mesh.position.set(0, 0.2, 0);
    this.root.add(this.status.mesh);
    this.details = createPanelSurface(1.28, 0.12, false);
    this.details.mesh.position.set(0, -0.34, 0);
    this.root.add(this.details.mesh);

    const topRow: Array<[XrPanelAction, string, number]> = [
      ["previous-step", "Prev", 0.18],
      ["toggle-autoplay", "Auto", 0.2],
      ["next-step", "Next", 0.18],
      ["reset", "Reset", 0.18],
      ["recenter", "Center", 0.22],
      ["exit-xr", "Exit", 0.18],
    ];
    this.addRow(topRow, 0.04);
    this.addRow(
      [
        ["cycle-preset", "Preset", 0.4],
        ["cycle-qubits", "Qubits", 0.36],
        ["cycle-pair", "Pair", 0.36],
      ],
      -0.15,
    );
  }

  update(state: XrPanelState) {
    drawSurface(
      this.status,
      `Step ${state.step}/${state.totalSteps}   ${state.activeOperation}   ${state.autoplay ? "PLAYING" : "PAUSED"}   ${state.qualityLabel}`,
      false,
    );
    this.updateButton("toggle-autoplay", state.autoplay ? "Pause" : "Auto");
    this.updateButton("cycle-preset", `Preset\n${state.presetLabel}`);
    this.updateButton("cycle-qubits", `Qubits\n${state.qubitsLabel}`);
    this.updateButton("cycle-pair", `Pair\n${state.pairLabel}`);
    this.setButtonEnabled("previous-step", state.canPrevious);
    this.setButtonEnabled("next-step", state.canNext);
    this.setButtonEnabled("cycle-pair", state.canSelectPair);
    drawSurface(this.details, `${state.classicalLabel}   ${state.correlationLabel}`, false);
  }

  actionFor(object: THREE.Object3D): XrPanelAction | undefined {
    if (object.userData.xrDisabled) return undefined;
    return (object.userData.xrAction as XrPanelAction | undefined);
  }

  clearHover() {
    this.buttons.forEach(({ mesh }) => mesh.material.color.setHex(0xffffff));
  }

  setHovered(action: XrPanelAction) {
    this.buttons.get(action)?.mesh.material.color.setHex(0x8be7ff);
  }

  dispose() {
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshBasicMaterial) material.map?.dispose();
          material.dispose();
        });
      }
    });
    this.root.clear();
  }

  private addRow(items: Array<[XrPanelAction, string, number]>, y: number) {
    const gap = 0.035;
    const totalWidth = items.reduce((sum, item) => sum + item[2], 0) + gap * (items.length - 1);
    let cursor = -totalWidth / 2;
    items.forEach(([action, label, width]) => {
      const surface = createPanelSurface(width, 0.12, true);
      surface.mesh.position.set(cursor + width / 2, y, 0);
      surface.mesh.userData.xrAction = action;
      drawSurface(surface, label, true);
      const button: XrPanelButton = { ...surface, action, label };
      this.buttons.set(action, button);
      this.targets.push(surface.mesh);
      this.root.add(surface.mesh);
      cursor += width + gap;
    });
  }

  private updateButton(action: XrPanelAction, label: string) {
    const button = this.buttons.get(action);
    if (!button || button.label === label) return;
    button.label = label;
    drawSurface(button, label, true);
  }

  private setButtonEnabled(action: XrPanelAction, enabled: boolean) {
    const button = this.buttons.get(action);
    if (!button) return;
    button.mesh.userData.xrDisabled = !enabled;
    button.mesh.material.opacity = enabled ? 1 : 0.42;
  }
}

function createPanelSurface(width: number, height: number, interactive: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: texture,
    transparent: true,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.025), material);
  return { mesh, texture, canvas };
}

function drawSurface(
  surface: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture },
  text: string,
  interactive: boolean,
) {
  const context = surface.canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, surface.canvas.width, surface.canvas.height);
  context.fillStyle = interactive ? "#29445f" : "#182033";
  context.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
  context.fillStyle = interactive ? "#dff7ff" : "#f6f7fb";
  context.font = interactive ? "800 42px system-ui, sans-serif" : "700 34px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * 50;
    context.fillText(line, surface.canvas.width / 2, surface.canvas.height / 2 + offset);
  });
  surface.texture.needsUpdate = true;
}
