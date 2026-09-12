import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SnapChefApp from "../../components/snapchef/SnapChefApp";
import "../../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><SnapChefApp /></StrictMode>,
);
