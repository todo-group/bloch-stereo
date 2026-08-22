import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/app.css";

if (import.meta.env.DEV) {
  const { setupXrEmulation } = await import("./xr/setupXrEmulation");
  await setupXrEmulation();
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
