import * as THREE from "three";
import type { XrControlPanel, XrPanelAction } from "./XrControlPanel";

type ControllerRig = {
  targetRay: THREE.XRTargetRaySpace;
  grip: THREE.XRGripSpace;
  hand: THREE.XRHandSpace;
  ray: THREE.Line;
  cursor: THREE.Mesh;
  gripModel: THREE.Mesh;
  handMarker: THREE.Mesh;
  intersections: THREE.Intersection[];
  hoveredAction?: XrPanelAction;
  onSelectStart: () => void;
  onConnected: (event: { data: XRInputSource }) => void;
  onDisconnected: () => void;
};

export class XrInteraction {
  private readonly raycaster = new THREE.Raycaster();
  private readonly rigs: ControllerRig[] = [];

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly panel: XrControlPanel,
    private readonly onAction: (action: XrPanelAction) => void,
  ) {
    for (let index = 0; index < 2; index += 1) this.rigs.push(this.createControllerRig(index));
  }

  update() {
    this.panel.clearHover();
    this.rigs.forEach((rig) => {
      rig.hoveredAction = undefined;
      if (!rig.targetRay.visible) return;

      this.raycaster.setFromXRController(rig.targetRay);
      rig.intersections.length = 0;
      this.raycaster.intersectObjects(this.panel.targets, false, rig.intersections);
      const hit = rig.intersections[0];
      rig.ray.scale.z = hit ? Math.min(1.3, hit.distance) : 1.3;
      rig.cursor.visible = Boolean(hit);
      if (!hit) return;
      rig.cursor.position.z = -hit.distance;
      rig.hoveredAction = this.panel.actionFor(hit.object);
      if (rig.hoveredAction) this.panel.setHovered(rig.hoveredAction);
    });
  }

  dispose() {
    this.rigs.forEach((rig) => {
      rig.targetRay.removeEventListener("selectstart", rig.onSelectStart);
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
      hoveredAction: undefined as XrPanelAction | undefined,
      onSelectStart: () => {
        if (rig.hoveredAction) this.onAction(rig.hoveredAction);
      },
      onConnected: (event: { data: XRInputSource }) => {
        const isHand = Boolean(event.data?.hand);
        targetRay.visible = true;
        grip.visible = !isHand;
        hand.visible = isHand;
      },
      onDisconnected: () => {
        targetRay.visible = false;
        grip.visible = false;
        hand.visible = false;
        rig.hoveredAction = undefined;
      },
    };

    targetRay.addEventListener("selectstart", rig.onSelectStart);
    targetRay.addEventListener("connected", rig.onConnected);
    targetRay.addEventListener("disconnected", rig.onDisconnected);
    this.scene.add(targetRay, grip, hand);
    return rig;
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
