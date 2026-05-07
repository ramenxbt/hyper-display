import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { PinView } from "./components/PinView";

const params = new URLSearchParams(window.location.search);
const pinCoin = params.get("pin");
const pinWallet = params.get("wallet");

const root = createRoot(document.getElementById("root")!);

if (pinCoin && pinWallet) {
  document.documentElement.classList.add("theme-dark");
  root.render(
    <StrictMode>
      <PinView coin={pinCoin} wallet={pinWallet} />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
