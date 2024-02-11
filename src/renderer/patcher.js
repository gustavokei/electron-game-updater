const isDevelopment = process.env.NODE_ENV !== 'production';
const { ipcRenderer } = require("electron");
const { showErrorAndPause } = require("./utils/showErrorAndPause")
const { getConfigFileRemote } = require("./utils/getConfigFileRemote")

module.exports = {
  patcher: (configFileLocal) => {
    const fs = require("fs");
    const filePath = ipcRenderer.sendSync("get-file-path", "");

    const showText = (msg) => {
      document.getElementById("txtStatus").innerHTML = msg;
    };

    const checkForUpdates = async () => {
      const remoteConfig = await getConfigFileRemote(configFileLocal?.configFileRemote);

      if (remoteConfig?.launcherVer > configFileLocal?.launcherVer) {

        showText("Baixando egu-config.json");

        ipcRenderer.send("download", {
          url: remoteConfig?.configFileRemote,
          options: {
            directory: filePath,
            filename: "egu-config.json",
            overwrite: true
          },
        });

        ipcRenderer.on("download complete", () => {
          document.getElementById("fileBar").style.setProperty("width", "100%");
          document.getElementById("txtProgress").innerHTML = "50%";
          document.getElementById("totalBar").style.setProperty("width", "50%");

          showText("Baixando launcher.exe");

          ipcRenderer.send("download", {
            url: remoteConfig?.launcherUrl,
            options: {
              directory: filePath,
              filename: "launcher-new.exe",
              overwrite: true
            },
          });

          ipcRenderer.on("download progress", (event, status) => {
            const fileProgress = Math.floor(status.percent * 100);
            document.getElementById("fileBar").style.setProperty("width", fileProgress + "%");
          });

          ipcRenderer.on("download progress", (event, status) => {
            const fileProgress = Math.floor(status.percent * 100);
            document.getElementById("fileBar").style.setProperty("width", fileProgress + "%");
          });

          ipcRenderer.on("download complete", () => {
            document.getElementById("fileBar").style.setProperty("width", "100%");
            document.getElementById("txtProgress").innerHTML = "100%";
            document.getElementById("totalBar").style.setProperty("width", "100%");
            replaceExecutable();
          });
        });

        ipcRenderer.on("download error", () => {
          showErrorAndPause("Ocorreu um erro ao atualizar, reinicie o launcher")
        });
      } else {
        getUpdate()
          .then((r) => runUpdate(r))
      }
    };


    const replaceExecutable = () => {
      const batchContent = `
      @echo off
      set MAX_RETRIES=3
      set RETRY_COUNT=0
      
      :RETRY
      move /Y "${filePath}\\launcher-new.exe" "${filePath}\\launcher.exe"
      if errorlevel 1 (
          set /A RETRY_COUNT+=1
          if %RETRY_COUNT% lss %MAX_RETRIES% (
              timeout /t 1 /nobreak >nul
              goto RETRY
          ) else (
              echo Maximum retries reached. Exiting.
              exit /b 1
          )
      )
      start "" "${filePath}\\launcher.exe"
      del /F "${filePath}\\launcher-update.bat"
      `;

      fs.writeFileSync(`${filePath}\\launcher-update.bat`, batchContent, 'utf8');

      const { spawn } = require("child_process");
      spawn(`start /min cmd.exe /C ${filePath}\\launcher-update.bat`, {
        detached: true,
        shell: true,
      });
      ipcRenderer.send("close-app");
    };

    document.getElementById("btnStart").addEventListener("click", () => {
      const { spawn } = require("child_process");
      spawn(configFileLocal.startCmd, {
        cwd: filePath + `\\${configFileLocal.clientDir}\\`,
        detached: true,
        shell: true,
      });
      ipcRenderer.send("close-app");
    });

    let localFiles = [];
    let remoteFiles = [];

    const getUpdate = async () => {
      let url = configFileLocal.updateList;
      let response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      let data = await response.json();
      return data;
    };

    const path = require("path");
    const getFiles = async (dir, filesList = []) => {
      const fs = require("fs").promises;
      const files = await fs.readdir(dir);
      for (const file of files) {
        const stat = await fs.stat(path.join(dir, file));
        if (stat.isDirectory())
          filesList = await getFiles(path.join(dir, file), filesList);
        else filesList.push(path.join(dir, file));
      }
      return filesList;
    };

    const runUpdate = (r) => {
      remoteFiles = r;
      if (!remoteFiles.length) {
        showText("Não foi possível buscar dados da atualização");
      } else {
        showText("Comparando arquivos");

        getFiles(filePath + `\\${configFileLocal.clientDir}\\`).then((res) => {
          res.forEach((file) => {
            const size = fs.statSync(file).size;
            const filesWithHash = remoteFiles.filter(item => Object.prototype.hasOwnProperty.call(item, 'hash'));
            const fileNamesWithHash = filesWithHash.map(item => item.file);
            if (
              fileNamesWithHash.indexOf(
                file.replace(filePath + `\\${configFileLocal.clientDir}\\`, "").replace(/\\/g, "/")
              ) > -1
            ) {
              const hash = require("crypto")
                .createHash("sha1")
                .update(fs.readFileSync(file))
                .digest("base64");
              file = localFiles.push({ file, size, hash });
            } else {
              file = localFiles.push({ file, size });
            }
          });

          remoteFiles.forEach((e) => {
            e.file =
              filePath +
              `\\${configFileLocal.clientDir}\\` +
              JSON.stringify(e.file).replace(/"/g, "").replace(/\\\\/g, "\\");
          });

          for (var i = 0; i < localFiles.length; i++) {
            for (var j = 0; j < remoteFiles.length; j++) {
              if (
                localFiles[i].hash != undefined &&
                localFiles[i].hash == remoteFiles[j].hash
              ) {
                remoteFiles.splice(j, 1);
                break;
              } else if (
                localFiles[i].file == remoteFiles[j].file &&
                localFiles[i].size == remoteFiles[j].size &&
                localFiles[i].hash == undefined
              ) {
                remoteFiles.splice(j, 1);
                break;
              }
            }
          }

          const totalRemoteSize = remoteFiles
            .map((item) => item.size)
            .reduce((prev, curr) => prev + curr, 0);
          let totalLocalSize = localFiles
            .map((item) => item.size)
            .reduce((prev, curr) => prev + curr, 0);
          const downloadedSize = totalRemoteSize + totalLocalSize;
          const totalPercentage = downloadedSize === 0 ? 0 : Math.floor((totalLocalSize * 100) / downloadedSize);

          document.getElementById("totalBar").style.setProperty("width", totalPercentage + "%");
          document.getElementById("txtProgress").innerHTML = totalPercentage + "%";

          const update = () => {
            if (remoteFiles.length > 0) {
              const url = remoteFiles[0].url;
              const name = remoteFiles[0].file.replace(/^.*[\\]/, "");
              const path = remoteFiles[0].file.replace(name, "");

              ipcRenderer.send("download", {
                url: url,
                options: {
                  directory: path,
                  overwrite: true
                },
              });
              showText("Baixando: " + name);
            } else {
              showText("Atualização concluída");
              document.getElementById("fileBar").style.setProperty("width", "100%");
              document.getElementById("btnStartDisabled").style.setProperty("display", "none");
              document.getElementById("totalBar").style.setProperty("width", "100%");
              document.getElementById("txtProgress").innerHTML = "100%";
            }
          };

          update();

          ipcRenderer.on("download progress", (event, status) => {
            const fileProgress = Math.floor(status.percent * 100);
            document.getElementById("fileBar").style.setProperty("width", fileProgress + "%");
          });

          ipcRenderer.on("download complete", () => {
            totalLocalSize += remoteFiles[0].size;
            remoteFiles.splice(0, 1);
            const totalPercentage = downloadedSize === 0 ? 0 : Math.floor((totalLocalSize * 100) / downloadedSize);
            document.getElementById("totalBar").style.setProperty("width", totalPercentage + "%");
            document.getElementById("txtProgress").innerHTML = totalPercentage + "%";

            update();
          });


          ipcRenderer.on("download error", () => {
            showErrorAndPause("Ocorreu um erro ao atualizar, reinicie o launcher")
          });
        });
      }
    };

    if (!fs.existsSync(filePath + `\\${configFileLocal.clientDir}\\`)) {
      fs.mkdirSync(filePath + `\\${configFileLocal.clientDir}\\`);
    }
    try {
      if (isDevelopment) {
        runUpdate(JSON.parse(fs.readFileSync("eguh-update-list.json")))
      } else {
        try {
          checkForUpdates();
        } catch (e) {
          showErrorAndPause("Erro ao tentar atualizar launcher")
        }
      }
    } catch (e) {
      showErrorAndPause(e)
    }
  },
};
