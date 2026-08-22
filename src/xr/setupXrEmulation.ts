export async function setupXrEmulation() {
  if (!import.meta.env.DEV || new URLSearchParams(window.location.search).get("emulate-xr") !== "1") return;

  const iwerModuleId = "/@id/iwer";
  const devUiModuleId = "/@id/@iwer/devui";
  const [{ XRDevice, metaQuest3 }, { DevUI }] = await Promise.all([
    import(/* @vite-ignore */ iwerModuleId) as Promise<typeof import("iwer")>,
    import(/* @vite-ignore */ devUiModuleId) as Promise<typeof import("@iwer/devui")>,
  ]);
  const device = new XRDevice(metaQuest3);
  device.installRuntime({ forceInstall: true });
  device.stereoEnabled = true;
  new DevUI(device);
  window.__BLOCH_XR_DEVICE__ = device;
}
