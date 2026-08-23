import * as THREE from "three";

export type XrPanelAction =
  | "previous-step"
  | "toggle-autoplay"
  | "next-step"
  | "reset"
  | "toggle-loop"
  | "show-2d"
  | "open-editor"
  | "view-top"
  | "view-default"
  | "view-bottom"
  | "select-pair-01"
  | "select-pair-02"
  | "select-pair-12";

export type XrPanelState = {
  canPrevious: boolean;
  canNext: boolean;
  canAutoplay: boolean;
  autoplay: boolean;
  loop: boolean;
};

type XrPanelButton = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  action?: XrPanelAction;
  label: string;
  icon?: XrButtonIcon;
  active: boolean;
};

type XrButtonIcon =
  | "skip-back"
  | "play"
  | "pause"
  | "skip-forward"
  | "reset"
  | "loop"
  | "eye"
  | "sliders"
  | "arrow-down"
  | "arrow-up";

type ButtonDefinition = [action: XrPanelAction | undefined, label: string, width: number, icon?: XrButtonIcon];

export class XrControlPanel {
  readonly root = new THREE.Group();
  readonly targets: THREE.Object3D[] = [];

  private readonly buttons = new Map<XrPanelAction, XrPanelButton>();

  constructor() {
    this.root.name = "xr-control-panel";
    this.addGroup(
      [
        ["previous-step", "Prev", 0.155, "skip-back"],
        ["toggle-autoplay", "Auto", 0.17, "play"],
        ["next-step", "Next", 0.155, "skip-forward"],
        ["reset", "Reset", 0.17, "reset"],
        ["toggle-loop", "Loop", 0.16, "loop"],
      ],
      -0.26,
      0.06,
    );
    this.addGroup(
      [
        [undefined, "VR", 0.12, "eye"],
        ["show-2d", "2D", 0.12],
        ["open-editor", "Circuit Editor", 0.28, "sliders"],
      ],
      0.56,
      0.06,
      "VR",
    );
    this.addGroup(
      [
        ["view-top", "Top", 0.15, "arrow-down"],
        ["view-default", "View", 0.17, "reset"],
        ["view-bottom", "Bottom", 0.19, "arrow-up"],
      ],
      0,
      -0.14,
    );
  }

  update(state: XrPanelState) {
    this.updateButton("toggle-autoplay", state.autoplay ? "Pause" : "Auto", state.autoplay, state.autoplay ? "pause" : "play");
    this.updateButton("toggle-loop", "Loop", state.loop, "loop");
    this.setButtonEnabled("previous-step", state.canPrevious);
    this.setButtonEnabled("next-step", state.canNext);
    this.setButtonEnabled("toggle-autoplay", state.canAutoplay);
    this.setButtonEnabled("toggle-loop", state.canAutoplay);
  }

  actionFor(object: THREE.Object3D): XrPanelAction | undefined {
    if (object.userData.xrDisabled) return undefined;
    return object.userData.xrAction as XrPanelAction | undefined;
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

  private addGroup(items: ButtonDefinition[], x: number, y: number, activeLabel?: string) {
    const gap = 0.018;
    const totalWidth = items.reduce((sum, item) => sum + item[2], 0) + gap * (items.length - 1);
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth + 0.04, 0.15, 0.018),
      new THREE.MeshBasicMaterial({ color: 0x07101f, transparent: true, opacity: 0.94 }),
    );
    backing.position.z = -0.018;
    group.add(backing);

    let cursor = -totalWidth / 2;
    items.forEach(([action, label, width, icon]) => {
      const surface = createPanelSurface(width, 0.11);
      const active = label === activeLabel;
      surface.mesh.position.set(cursor + width / 2, 0, 0);
      drawButton(surface, label, active, icon);
      const button: XrPanelButton = { ...surface, action, label, icon, active };
      if (action) {
        surface.mesh.userData.xrAction = action;
        this.buttons.set(action, button);
        this.targets.push(surface.mesh);
      }
      group.add(surface.mesh);
      cursor += width + gap;
    });
    this.root.add(group);
  }

  private updateButton(action: XrPanelAction, label: string, active: boolean, icon?: XrButtonIcon) {
    const button = this.buttons.get(action);
    if (!button || (button.label === label && button.active === active && button.icon === icon)) return;
    button.label = label;
    button.icon = icon;
    button.active = active;
    drawButton(button, label, active, icon);
  }

  private setButtonEnabled(action: XrPanelAction, enabled: boolean) {
    const button = this.buttons.get(action);
    if (!button) return;
    button.mesh.userData.xrDisabled = !enabled;
    button.mesh.material.opacity = enabled ? 1 : 0.42;
  }
}

function createPanelSurface(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, transparent: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.025), material);
  return { mesh, texture, canvas };
}

function drawButton(
  surface: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture },
  text: string,
  active: boolean,
  icon?: XrButtonIcon,
) {
  const context = surface.canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, surface.canvas.width, surface.canvas.height);
  context.fillStyle = active ? "#0e8396" : "#29445f";
  context.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
  context.strokeStyle = active ? "#8be7ff" : "#52667e";
  context.lineWidth = 6;
  context.strokeRect(3, 3, surface.canvas.width - 6, surface.canvas.height - 6);
  context.fillStyle = "#dff7ff";
  context.font = text === "Circuit Editor" ? "800 38px system-ui, sans-serif" : "800 48px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const textWidth = context.measureText(text).width;
  const iconSize = icon ? 42 : 0;
  const iconGap = icon ? 18 : 0;
  const contentWidth = textWidth + iconSize + iconGap;
  const contentLeft = (surface.canvas.width - contentWidth) / 2;
  if (icon) drawIcon(context, icon, contentLeft + iconSize / 2, surface.canvas.height / 2, iconSize);
  context.fillText(text, contentLeft + iconSize + iconGap + textWidth / 2, surface.canvas.height / 2 + 1);
  surface.texture.needsUpdate = true;
}

function drawIcon(context: CanvasRenderingContext2D, icon: XrButtonIcon, x: number, y: number, size: number) {
  const radius = size / 2;
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#dff7ff";
  context.fillStyle = "#dff7ff";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (icon === "play") {
    drawTriangle(context, -radius * 0.35, -radius * 0.62, radius * 0.68, 0, -radius * 0.35, radius * 0.62);
  } else if (icon === "pause") {
    context.fillRect(-radius * 0.55, -radius * 0.65, radius * 0.35, radius * 1.3);
    context.fillRect(radius * 0.2, -radius * 0.65, radius * 0.35, radius * 1.3);
  } else if (icon === "skip-back" || icon === "skip-forward") {
    const direction = icon === "skip-forward" ? 1 : -1;
    context.beginPath();
    context.moveTo(direction * radius * 0.68, -radius * 0.68);
    context.lineTo(direction * radius * 0.68, radius * 0.68);
    context.stroke();
    drawTriangle(
      context,
      direction * -radius * 0.42,
      -radius * 0.62,
      direction * radius * 0.58,
      0,
      direction * -radius * 0.42,
      radius * 0.62,
    );
  } else if (icon === "reset") {
    context.beginPath();
    context.arc(0, 0, radius * 0.62, -Math.PI * 0.2, Math.PI * 1.55);
    context.stroke();
    context.beginPath();
    context.moveTo(-radius * 0.72, -radius * 0.2);
    context.lineTo(-radius * 0.74, -radius * 0.72);
    context.lineTo(-radius * 0.22, -radius * 0.62);
    context.stroke();
  } else if (icon === "loop") {
    context.beginPath();
    context.moveTo(-radius * 0.68, -radius * 0.3);
    context.lineTo(radius * 0.45, -radius * 0.3);
    context.lineTo(radius * 0.22, -radius * 0.56);
    context.moveTo(radius * 0.68, radius * 0.3);
    context.lineTo(-radius * 0.45, radius * 0.3);
    context.lineTo(-radius * 0.22, radius * 0.56);
    context.stroke();
  } else if (icon === "eye") {
    context.beginPath();
    context.moveTo(-radius * 0.78, 0);
    context.quadraticCurveTo(0, -radius * 0.7, radius * 0.78, 0);
    context.quadraticCurveTo(0, radius * 0.7, -radius * 0.78, 0);
    context.stroke();
    context.beginPath();
    context.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    context.fill();
  } else if (icon === "sliders") {
    const positions = [-radius * 0.48, 0, radius * 0.48];
    const knobs = [-radius * 0.2, radius * 0.3, -radius * 0.05];
    positions.forEach((lineY, index) => {
      context.beginPath();
      context.moveTo(-radius * 0.72, lineY);
      context.lineTo(radius * 0.72, lineY);
      context.stroke();
      context.beginPath();
      context.arc(knobs[index], lineY, radius * 0.14, 0, Math.PI * 2);
      context.fill();
    });
  } else {
    const direction = icon === "arrow-down" ? 1 : -1;
    context.beginPath();
    context.moveTo(0, direction * -radius * 0.7);
    context.lineTo(0, direction * radius * 0.62);
    context.moveTo(direction * -radius * 0.42, direction * radius * 0.22);
    context.lineTo(0, direction * radius * 0.62);
    context.lineTo(direction * radius * 0.42, direction * radius * 0.22);
    context.stroke();
  }
  context.restore();
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.lineTo(x3, y3);
  context.closePath();
  context.fill();
}
