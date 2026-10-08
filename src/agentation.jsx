import React from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";

const mount = document.getElementById("agentation-root");

if (mount) {
  createRoot(mount).render(<Agentation />);
}
