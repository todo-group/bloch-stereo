/// <reference types="vite/client" />

interface Window {
  __BLOCH_XR_DEVICE__?: import("iwer").XRDevice;
}

declare const __APP_VERSION__: string;
