import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { AdjustableAnaglyphEffect } from "./AdjustableAnaglyphEffect";
import type { BlochVector, DisplayMode, StereoSettings } from "../circuit/types";
import { BlochSceneContent, SPHERE_SPACING } from "./BlochSceneContent";
import { probeImmersiveVr, type XrSupportState } from "../xr/XrCapability";
import { XrSessionController } from "../xr/XrSessionController";
import { XrScene, type XrSceneActions } from "../xr/XrScene";
import type { XrPanelState } from "../xr/XrControlPanel";

type BlochSphereStereoProps = {
  vectors: BlochVector[];
  labels: string[];
  qubitIndices: number[];
  displayMode: DisplayMode;
  stereoSettings: StereoSettings;
  activeStep: number;
  xrPanelState: Omit<XrPanelState, "qualityLabel">;
  xrActions: Omit<XrSceneActions, "exitXr">;
};

const STANDARD_CAMERA_RADIUS = 6.2;
const RESET_CAMERA_YAW = 0;
const RESET_CAMERA_PITCH = 0;
const TOP_CAMERA_PITCH = Math.PI / 2 - 0.01;
const BOTTOM_CAMERA_PITCH = -TOP_CAMERA_PITCH;

export function BlochSphereStereo({
  vectors,
  labels,
  qubitIndices,
  displayMode,
  stereoSettings,
  activeStep,
  xrPanelState,
  xrActions,
}: BlochSphereStereoProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneContentRef = useRef<BlochSceneContent | null>(null);
  const xrSceneRef = useRef<XrScene | null>(null);
  const xrSessionControllerRef = useRef<XrSessionController | null>(null);
  const xrRuntimeRef = useRef({ panelState: xrPanelState, actions: xrActions });
  const previousQubitIndicesRef = useRef(qubitIndices.slice());
  const modeRef = useRef(displayMode);
  const stereoSettingsRef = useRef(stereoSettings);
  const cameraMotion = useRef({
    yaw: RESET_CAMERA_YAW,
    pitch: RESET_CAMERA_PITCH,
    targetYaw: null as number | null,
    targetPitch: null as number | null,
    radius: STANDARD_CAMERA_RADIUS,
    targetRadius: STANDARD_CAMERA_RADIUS,
    yawVelocity: 0,
    pitchVelocity: 0,
  });
  const pointerRef = useRef({ dragging: false, x: 0, y: 0 });
  const viewportRef = useRef({ width: 1, height: 1, aspect: 1 });
  const keyboardCameraRef = useRef<{
    mode: "rotate" | "zoom" | null;
    x: number;
    y: number;
    initialized: boolean;
  }>({ mode: null, x: 0, y: 0, initialized: false });
  const [xrSupport, setXrSupport] = useState<XrSupportState>("checking");
  const [xrStatus, setXrStatus] = useState<"idle" | "starting" | "presenting">("idle");
  const [xrError, setXrError] = useState<string>();

  xrRuntimeRef.current = { panelState: xrPanelState, actions: xrActions };

  useEffect(() => {
    let cancelled = false;
    void probeImmersiveVr().then((support) => {
      if (!cancelled) setXrSupport(support);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    modeRef.current = displayMode;
  }, [displayMode]);

  useEffect(() => {
    stereoSettingsRef.current = stereoSettings;
  }, [stereoSettings]);

  useEffect(() => {
    const qubitSelectionChanged = !sameNumberArray(previousQubitIndicesRef.current, qubitIndices);
    sceneContentRef.current?.setTargetVectors(vectors, qubitSelectionChanged);
    previousQubitIndicesRef.current = qubitIndices.slice();
  }, [vectors, activeStep, qubitIndices]);

  useEffect(() => {
    sceneContentRef.current?.setLabels(labels);
  }, [labels]);

  useEffect(() => {
    sceneContentRef.current?.setQubitIndices(qubitIndices);
  }, [qubitIndices]);

  useEffect(() => {
    xrSceneRef.current?.setPanelState({ ...xrPanelState, qualityLabel: "Quality: standard" });
  }, [xrPanelState]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.xr.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0b1020, 1);
    mount.appendChild(renderer.domElement);

    const effect = new AdjustableAnaglyphEffect(renderer);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    const perspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 4);
    scene.add(ambient, keyLight);

    const sceneContent = new BlochSceneContent(vectors, labels, qubitIndices);
    sceneContentRef.current = sceneContent;
    let sessionController: XrSessionController;
    const xrScene = new XrScene(
      renderer,
      scene,
      sceneContent,
      {
        previousStep: () => xrRuntimeRef.current.actions.previousStep(),
        nextStep: () => xrRuntimeRef.current.actions.nextStep(),
        reset: () => xrRuntimeRef.current.actions.reset(),
        toggleAutoplay: () => xrRuntimeRef.current.actions.toggleAutoplay(),
        stopAutoplay: () => xrRuntimeRef.current.actions.stopAutoplay(),
        cyclePreset: () => xrRuntimeRef.current.actions.cyclePreset(),
        cycleQubits: () => xrRuntimeRef.current.actions.cycleQubits(),
        cyclePair: () => xrRuntimeRef.current.actions.cyclePair(),
        exitXr: () => void sessionController.end(),
      },
      { ...xrRuntimeRef.current.panelState, qualityLabel: "Quality: standard" },
    );
    sessionController = new XrSessionController(renderer, {
      onSessionStarted: () => {
        xrScene.startSession();
        setXrStatus("presenting");
        setXrError(undefined);
      },
      onSessionEnded: () => {
        xrScene.endSession();
        xrRuntimeRef.current.actions.stopAutoplay();
        resize();
        setXrStatus("idle");
      },
      onSessionHidden: () => {
        xrRuntimeRef.current.actions.stopAutoplay();
      },
      onReferenceSpaceReset: () => xrScene.requestRecenter(),
    });
    xrSceneRef.current = xrScene;
    xrSessionControllerRef.current = sessionController;

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));
      const aspect = width / height;
      viewportRef.current = { width, height, aspect };
      if (!renderer.xr.isPresenting) effect.setSize(width, height);
      perspectiveCamera.aspect = aspect;
      perspectiveCamera.updateProjectionMatrix();
      updateOrthographicProjection(orthographicCamera, aspect, cameraMotion.current.radius, vectors.length);
    };
    const resizeObserver = new ResizeObserver(resize);

    const onPointerDown = (event: PointerEvent) => {
      pointerRef.current = { dragging: true, x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      cameraMotion.current.yawVelocity += dx * 0.0009;
      cameraMotion.current.pitchVelocity += dy * 0.00075;
      cameraMotion.current.targetYaw = null;
      cameraMotion.current.targetPitch = null;
    };
    const onPointerUp = () => {
      pointerRef.current.dragging = false;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraMotion.current.targetRadius = clamp(cameraMotion.current.targetRadius + event.deltaY * 0.004, 3.8, 12);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        if (keyboardCameraRef.current.mode !== "rotate") {
          keyboardCameraRef.current = { mode: "rotate", x: 0, y: 0, initialized: false };
        }
      } else if (event.key === "z" || event.key === "Z") {
        event.preventDefault();
        if (keyboardCameraRef.current.mode !== "zoom") {
          keyboardCameraRef.current = { mode: "zoom", x: 0, y: 0, initialized: false };
        }
      } else if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        resetCameraView();
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        setCameraView(RESET_CAMERA_YAW, TOP_CAMERA_PITCH);
      } else if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setCameraView(RESET_CAMERA_YAW, BOTTOM_CAMERA_PITCH);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const mode = keyboardCameraRef.current.mode;
      if (
        (mode === "rotate" && (event.key === "c" || event.key === "C")) ||
        (mode === "zoom" && (event.key === "z" || event.key === "Z"))
      ) {
        keyboardCameraRef.current = { mode: null, x: 0, y: 0, initialized: false };
      }
    };
    const onMouseMove = (event: MouseEvent) => {
      const keyboardCamera = keyboardCameraRef.current;
      if (!keyboardCamera.mode) return;
      event.preventDefault();
      if (!keyboardCamera.initialized) {
        keyboardCamera.x = event.clientX;
        keyboardCamera.y = event.clientY;
        keyboardCamera.initialized = true;
        return;
      }
      const dx = event.clientX - keyboardCamera.x;
      const dy = event.clientY - keyboardCamera.y;
      keyboardCamera.x = event.clientX;
      keyboardCamera.y = event.clientY;
      if (keyboardCamera.mode === "rotate") {
        cameraMotion.current.yawVelocity += dx * 0.0009;
        cameraMotion.current.pitchVelocity += dy * 0.00075;
        cameraMotion.current.targetYaw = null;
        cameraMotion.current.targetPitch = null;
      } else {
        cameraMotion.current.targetRadius = clamp(cameraMotion.current.targetRadius + dy * 0.012, 3.8, 12);
      }
    };
    const onWindowBlur = () => {
      keyboardCameraRef.current = { mode: null, x: 0, y: 0, initialized: false };
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("resize", resize);
    resizeObserver.observe(mount);
    resize();

    const render = (time: number) => {
      sceneContent.update(time);
      xrScene.update(time);
      if (renderer.xr.isPresenting) {
        renderer.render(scene, perspectiveCamera);
      } else if (modeRef.current === "anaglyph-red-green") {
        updateCamera(perspectiveCamera);
        effect.eyeSeparation = stereoSettingsRef.current.eyeSeparation;
        effect.redGain = stereoSettingsRef.current.redGain;
        effect.cyanGain = stereoSettingsRef.current.cyanGain;
        effect.render(scene, perspectiveCamera);
      } else {
        updateCamera(orthographicCamera);
        updateOrthographicProjection(orthographicCamera, viewportRef.current.aspect, cameraMotion.current.radius, vectors.length);
        renderer.render(scene, orthographicCamera);
      }
    };
    renderer.setAnimationLoop(render);

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("blur", onWindowBlur);
      mount.removeChild(renderer.domElement);
      xrSessionControllerRef.current = null;
      xrSceneRef.current = null;
      sessionController.dispose();
      xrScene.dispose();
      sceneContentRef.current = null;
      sceneContent.dispose();
      effect.dispose();
      renderer.dispose();
    };
  }, [vectors.length]);

  return (
    <div className={displayMode === "anaglyph-red-green" ? "bloch-stage is-stereo" : "bloch-stage"}>
      <div ref={mountRef} className="bloch-canvas" />
      <div className="xr-entry-control" aria-live="polite">
        {xrSupport === "supported" ? (
          <button type="button" onClick={() => void startXr()} disabled={xrStatus !== "idle"} title="Enter immersive VR">
            {xrStatus === "starting" ? "Starting VR…" : xrStatus === "presenting" ? "VR active" : "Enter VR"}
          </button>
        ) : xrSupport === "unsupported" ? (
          <span>VR unavailable in this browser</span>
        ) : (
          <span>Checking VR…</span>
        )}
        {xrError ? <span className="xr-error">{xrError}</span> : null}
      </div>
      <div className="camera-view-controls" aria-label="Bloch sphere camera views">
        <button type="button" onClick={() => setCameraView(RESET_CAMERA_YAW, TOP_CAMERA_PITCH)} title="View from above">
          <ArrowDown aria-hidden="true" />
          Top
        </button>
        <button type="button" onClick={resetCameraView} title="Reset Bloch sphere view">
          <RotateCcw aria-hidden="true" />
          View
        </button>
        <button type="button" onClick={() => setCameraView(RESET_CAMERA_YAW, BOTTOM_CAMERA_PITCH)} title="View from below">
          <ArrowUp aria-hidden="true" />
          Bottom
        </button>
      </div>
      <div className="sphere-labels" aria-hidden="true">
        {vectors.map((vector, index) => (
          <span key={index}>
            {labels[index] ?? `q${index}`} · purity {vector.purity.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );

  function resetCameraView() {
    setCameraView(RESET_CAMERA_YAW, RESET_CAMERA_PITCH, STANDARD_CAMERA_RADIUS);
  }

  async function startXr() {
    const controller = xrSessionControllerRef.current;
    if (!controller || controller.isPresenting) return;
    setXrStatus("starting");
    setXrError(undefined);
    try {
      await controller.start();
    } catch (error) {
      setXrStatus("idle");
      setXrError(error instanceof Error ? error.message : "Unable to start VR.");
    }
  }

  function setCameraView(yaw: number, pitch: number, targetRadius = cameraMotion.current.targetRadius) {
    cameraMotion.current.targetYaw = yaw;
    cameraMotion.current.targetPitch = pitch;
    cameraMotion.current.targetRadius = targetRadius;
    cameraMotion.current.yawVelocity = 0;
    cameraMotion.current.pitchVelocity = 0;
    pointerRef.current.dragging = false;
    keyboardCameraRef.current = { mode: null, x: 0, y: 0, initialized: false };
  }

  function updateCamera(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    const motion = cameraMotion.current;
    if (modeRef.current === "anaglyph-red-green") {
      const stereoRadius = clamp(4.6 + vectors.length * 0.35, 4.8, 8.2);
      if (motion.targetRadius > stereoRadius) {
        motion.targetRadius += (stereoRadius - motion.targetRadius) * 0.035;
      }
    }
    motion.radius += (motion.targetRadius - motion.radius) * 0.08;
    motion.yaw += motion.yawVelocity;
    motion.pitch = clamp(motion.pitch + motion.pitchVelocity, BOTTOM_CAMERA_PITCH, TOP_CAMERA_PITCH);
    if (motion.targetYaw !== null && motion.targetPitch !== null) {
      const yawDelta = shortestAngleDelta(motion.yaw, motion.targetYaw);
      const pitchDelta = motion.targetPitch - motion.pitch;
      motion.yaw += yawDelta * 0.12;
      motion.pitch = clamp(motion.pitch + pitchDelta * 0.12, BOTTOM_CAMERA_PITCH, TOP_CAMERA_PITCH);
      if (Math.abs(yawDelta) < 0.001 && Math.abs(pitchDelta) < 0.001) {
        motion.yaw = motion.targetYaw;
        motion.pitch = motion.targetPitch;
        motion.targetYaw = null;
        motion.targetPitch = null;
      }
    }
    motion.yawVelocity *= pointerRef.current.dragging ? 0.82 : 0.94;
    motion.pitchVelocity *= pointerRef.current.dragging ? 0.82 : 0.94;
    camera.up.set(0, 0, 1);
    camera.position.set(
      Math.sin(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
      -Math.cos(motion.yaw) * Math.cos(motion.pitch) * motion.radius,
      Math.sin(motion.pitch) * motion.radius,
    );
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.focus = modeRef.current === "anaglyph-red-green" ? stereoSettingsRef.current.convergenceDistance : motion.radius;
    }
    camera.lookAt(0, 0, 0);
  }
}

function sameNumberArray(first: number[], second: number[]): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function updateOrthographicProjection(
  camera: THREE.OrthographicCamera,
  aspect: number,
  radius: number,
  sphereCount: number,
) {
  const sphereWidth = Math.max(0, sphereCount - 1) * SPHERE_SPACING + 2.4;
  const minimumViewHeight = Math.max(3.2, sphereWidth / Math.max(0.5, aspect) + 0.35);
  const zoomScale = radius / STANDARD_CAMERA_RADIUS;
  const viewHeight = clamp(minimumViewHeight * zoomScale, 2.8, 14);
  const viewWidth = viewHeight * aspect;

  camera.left = -viewWidth / 2;
  camera.right = viewWidth / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
