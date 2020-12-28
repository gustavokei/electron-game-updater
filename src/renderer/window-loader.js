import React from "react";
import "./window-loader.scss";

const WindowLoader = () => {
  // Listen for messages
  const { ipcRenderer } = require("electron");
  ipcRenderer.on("message", function (event, text) {
    document.getElementById("LoaderContent").innerHTML = text;
  });

  return (
    <div id="LoaderWrapper">
      <div id="LoaderContent">Inicializando</div>
    </div>
  );
};

export default WindowLoader;
