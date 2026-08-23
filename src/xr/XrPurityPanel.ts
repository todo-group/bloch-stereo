import * as THREE from "three";

const SPHERE_WORLD_SPACING = 0.441;

export type XrPurityValue = {
  label: string;
  purity: number;
};

type PuritySurface = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
};

export class XrPurityPanel {
  readonly root = new THREE.Group();

  private surfaces: PuritySurface[] = [];

  constructor(values: XrPurityValue[]) {
    this.root.name = "xr-purity-panel";
    this.update(values);
  }

  update(values: XrPurityValue[]) {
    if (this.surfaces.length !== values.length) this.rebuild(values.length);
    const center = (values.length - 1) / 2;
    values.forEach((value, index) => {
      const surface = this.surfaces[index];
      surface.mesh.position.x = (index - center) * SPHERE_WORLD_SPACING;
      drawPurity(surface, `${value.label} · purity ${value.purity.toFixed(2)}`);
    });
  }

  dispose() {
    this.clearSurfaces();
    this.root.clear();
  }

  private rebuild(count: number) {
    this.clearSurfaces();
    this.surfaces = Array.from({ length: count }, () => createPuritySurface());
    this.surfaces.forEach(({ mesh }) => this.root.add(mesh));
  }

  private clearSurfaces() {
    this.surfaces.forEach(({ mesh, texture }) => {
      this.root.remove(mesh);
      mesh.geometry.dispose();
      texture.dispose();
      mesh.material.dispose();
    });
    this.surfaces = [];
  }
}

function createPuritySurface(): PuritySurface {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 160;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.085, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, transparent: true }),
  );
  return { mesh, texture, canvas };
}

function drawPurity(surface: PuritySurface, text: string) {
  const context = surface.canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, surface.canvas.width, surface.canvas.height);
  context.fillStyle = "rgba(24, 32, 51, 0.96)";
  context.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
  context.strokeStyle = "#52667e";
  context.lineWidth = 6;
  context.strokeRect(3, 3, surface.canvas.width - 6, surface.canvas.height - 6);
  context.fillStyle = "#dfe8f7";
  context.font = "800 42px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, surface.canvas.width / 2, surface.canvas.height / 2 + 1);
  surface.texture.needsUpdate = true;
}
