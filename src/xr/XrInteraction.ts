import * as THREE from "three";
import type { XrPanelAction } from "./XrControlPanel";

export type XrInteractiveSurface = {
  targets: THREE.Object3D[];
  actionFor: (object: THREE.Object3D) => XrPanelAction | undefined;
  clearHover: () => void;
  setHovered: (action: XrPanelAction) => void;
};

export type XrNavigationInput = {
  rotationYawDelta: number;
  rotationPitchDelta: number;
  zoom: number;
};

type ControllerRig = {
  targetRay: THREE.XRTargetRaySpace;
  grip: THREE.XRGripSpace;
  hand: THREE.XRHandSpace;
  ray: THREE.Line;
  cursor: THREE.Mesh;
  gripModel: THREE.Mesh;
  handMarker: THREE.Mesh;
  intersections: THREE.Intersection[];
  inputSource?: XRInputSource;
  hoveredAction?: XrPanelAction;
  dragging: boolean;
  pointerDirection: THREE.Vector3;
  previousPointerYaw: number;
  previousPointerPitch: number;
  onSelectStart: () => void;
  onSelectEnd: () => void;
  onConnected: (event: { data: XRInputSource }) => void;
  onDisconnected: () => void;
};

export class XrInteraction {
  private readonly raycaster = new THREE.Raycaster();
  private readonly rigs: ControllerRig[] = [];
  private readonly targets: THREE.Object3D[];

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly surfaces: XrInteractiveSurface[],
    private readonly onAction: (action: XrPanelAction) => void,
  ) {
    this.targets = surfaces.flatMap((surface) => surface.targets);
    for (let index = 0; index < 2; index += 1) this.rigs.push(this.createControllerRig(index));
  }

  update(): XrNavigationInput {
    const navigation = this.readNavigationInput();
    this.surfaces.forEach((surface) => surface.clearHover());
    this.rigs.forEach((rig) => {
      rig.hoveredAction = undefined;
      if (!rig.targetRay.visible) return;

      if (rig.dragging) {
        this.appendDragNavigation(rig, navigation);
        rig.cursor.visible = false;
        rig.ray.scale.z = 1.3;
        return;
      }

      this.raycaster.setFromXRController(rig.targetRay);
      rig.intersections.length = 0;
      this.raycaster.intersectObjects(this.targets, false, rig.intersections);
      const hit = rig.intersections.find(({ object }) => isWorldVisible(object));
      rig.ray.scale.z = hit ? Math.min(1.3, hit.distance) : 1.3;
      rig.cursor.visible = Boolean(hit);
      if (!hit) return;
      rig.cursor.position.z = -hit.distance;
      for (const surface of this.surfaces) {
        const action = surface.actionFor(hit.object);
        if (action) {
          rig.hoveredAction = action;
          break;
        }
      }
      if (rig.hoveredAction) {
        const hoveredAction = rig.hoveredAction;
        this.surfaces.forEach((surface) => surface.setHovered(hoveredAction));
      }
    });
    return navigation;
  }

  dispose() {
    this.rigs.forEach((rig) => {
      rig.targetRay.removeEventListener("selectstart", rig.onSelectStart);
      rig.targetRay.removeEventListener("selectend", rig.onSelectEnd);
      rig.targetRay.removeEventListener("connected", rig.onConnected);
      rig.targetRay.removeEventListener("disconnected", rig.onDisconnected);
      this.scene.remove(rig.targetRay, rig.grip, rig.hand);
      rig.targetRay.remove(rig.ray);
      rig.targetRay.remove(rig.cursor);
      rig.grip.remove(rig.gripModel);
      rig.hand.remove(rig.handMarker);
      rig.ray.geometry.dispose();
      (rig.ray.material as THREE.Material).dispose();
      disposeMesh(rig.cursor);
      disposeMesh(rig.gripModel);
      disposeMesh(rig.handMarker);
    });
    this.rigs.length = 0;
  }

  private createControllerRig(index: number): ControllerRig {
    const targetRay = this.renderer.xr.getController(index);
    const grip = this.renderer.xr.getControllerGrip(index);
    const hand = this.renderer.xr.getHand(index);
    const ray = createRay();
    const cursor = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffdc73, depthTest: false }),
    );
    cursor.visible = false;
    const controllerModel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.025, 0.11, 12),
      new THREE.MeshBasicMaterial({ color: 0xb8dfff }),
    );
    controllerModel.rotation.x = Math.PI / 2;
    grip.add(controllerModel);
    const handMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.8 }),
    );
    hand.add(handMarker);
    targetRay.add(ray, cursor);
    targetRay.visible = false;
    grip.visible = false;
    hand.visible = false;

    const rig = {
      targetRay,
      grip,
      hand,
      ray,
      cursor,
      gripModel: controllerModel,
      handMarker,
      intersections: [] as THREE.Intersection[],
      inputSource: undefined as XRInputSource | undefined,
      hoveredAction: undefined as XrPanelAction | undefined,
      dragging: false,
      pointerDirection: new THREE.Vector3(),
      previousPointerYaw: 0,
      previousPointerPitch: 0,
      onSelectStart: () => {
        if (rig.hoveredAction) {
          this.onAction(rig.hoveredAction);
          return;
        }
        rig.dragging = true;
        this.capturePointerDirection(rig);
      },
      onSelectEnd: () => { rig.dragging = false; },
      onConnected: (event: { data: XRInputSource }) => {
        const isHand = Boolean(event.data?.hand);
        rig.inputSource = event.data;
        targetRay.visible = true;
        grip.visible = !isHand;
        hand.visible = isHand;
      },
      onDisconnected: () => {
        targetRay.visible = false;
        grip.visible = false;
        hand.visible = false;
        rig.inputSource = undefined;
        rig.hoveredAction = undefined;
        rig.dragging = false;
      },
    };

    targetRay.addEventListener("selectstart", rig.onSelectStart);
    targetRay.addEventListener("selectend", rig.onSelectEnd);
    targetRay.addEventListener("connected", rig.onConnected);
    targetRay.addEventListener("disconnected", rig.onDisconnected);
    this.scene.add(targetRay, grip, hand);
    return rig;
  }

  private readNavigationInput(): XrNavigationInput {
    const input: XrNavigationInput = { rotationYawDelta: 0, rotationPitchDelta: 0, zoom: 0 };
    this.rigs.forEach((rig) => {
      const source = rig.inputSource;
      const axes = source?.gamepad?.axes;
      if (!source || !axes || axes.length < 2) return;
      const y = applyDeadzone(Number(axes[axes.length - 1] ?? 0));
      input.zoom = clamp(input.zoom + y, -1, 1);
    });
    return input;
  }

  private capturePointerDirection(rig: ControllerRig) {
    rig.targetRay.getWorldDirection(rig.pointerDirection).negate();
    rig.previousPointerYaw = Math.atan2(rig.pointerDirection.x, -rig.pointerDirection.z);
    rig.previousPointerPitch = Math.asin(clamp(rig.pointerDirection.y, -1, 1));
  }

  private appendDragNavigation(rig: ControllerRig, navigation: XrNavigationInput) {
    rig.targetRay.getWorldDirection(rig.pointerDirection).negate();
    const yaw = Math.atan2(rig.pointerDirection.x, -rig.pointerDirection.z);
    const pitch = Math.asin(clamp(rig.pointerDirection.y, -1, 1));
    navigation.rotationYawDelta += clamp(shortestAngleDelta(rig.previousPointerYaw, yaw), -0.12, 0.12);
    navigation.rotationPitchDelta += clamp(pitch - rig.previousPointerPitch, -0.12, 0.12);
    rig.previousPointerYaw = yaw;
    rig.previousPointerPitch = pitch;
  }
}

function createRay(): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
  const ray = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.9 }));
  ray.name = "xr-selection-ray";
  return ray;
}

function disposeMesh(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh)) return;
  object.geometry.dispose();
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => material.dispose());
}

function applyDeadzone(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude < 0.16) return 0;
  return Math.sign(value) * (magnitude - 0.16) / 0.84;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function isWorldVisible(object: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}
