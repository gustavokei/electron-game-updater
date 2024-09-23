import React from "react";
import MainWindow from "./mainWindow";

import { createRoot } from "react-dom/client";
const container = document.getElementById("app");
const root = createRoot(container);
root.render(<MainWindow />);
