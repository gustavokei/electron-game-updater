import { hot } from 'react-hot-loader/root';
import React from "react";
import "./window-patcher.scss";
import Iframe from "react-iframe";
import { getConfigFileLocal } from "./utils/getConfigFileLocal.js"
import { showErrorAndPause } from './utils/showErrorAndPause.js';

const MainWindow = () => {
  const img1 = require("./assets/background.jpg");
  const img2 = require("./assets/close-default.jpg");
  const img3 = require("./assets/close-down.jpg");
  const img4 = require("./assets/close-hover.jpg");
  const img5 = require("./assets/start-default.jpg");
  const img6 = require("./assets/start-disabled.jpg");
  const img7 = require("./assets/start-down.jpg");
  const img8 = require("./assets/start-hover.jpg");
  const { patcher } = require("./patcher.js");
  const { ipcRenderer } = require("electron");
  const configFileLocal = getConfigFileLocal()
  ipcRenderer.on("call-patcher", () => {
    document.getElementById("btnClose").addEventListener("click", () => {
      ipcRenderer.send("close-app");
    });
    if (!configFileLocal) {
      showErrorAndPause("Não foi possível encontrar egu-config.json")
    } else {
      patcher(configFileLocal);
    }
  });

  return (
    <div className="App">
      <div className="draggable"></div>
      <div id="preload">
        <img src={img1} />
        <img src={img2} />
        <img src={img3} />
        <img src={img4} />
        <img src={img5} />
        <img src={img6} />
        <img src={img7} />
        <img src={img8} />
      </div>
      <button id="btnClose" />
      <button id="btnStart" />
      <button id="btnStartDisabled" />
      <span id="txtFile" className="text">
        Arquivo
      </span>
      <span id="txtTotal" className="text">
        Total
      </span>
      <span id="txtStatus" className="text">
        Buscando dados da atualização
      </span>
      <span id="txtProgress" className="text">
        0%
      </span>
      <div id="fileProgress">
        <div id="fileLeft" />
        <div id="fileMid">
          <div id="fileBar"></div>
        </div>
      </div>
      <div id="totalProgress">
        <div id="totalLeft" />
        <div id="totalMid">
          <div id="totalBar" />
        </div>
      </div>
      {configFileLocal?.iframeUrl && <Iframe url={configFileLocal?.iframeUrl} id="iframe" />}
    </div>
  );
};

export default hot(MainWindow);
