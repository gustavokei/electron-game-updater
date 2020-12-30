module.exports = {
  patcher: () => {
    const fs = require("fs");
    const { ipcRenderer } = require("electron");
    const filePath = ipcRenderer.sendSync("get-file-path", "");
    const remote = require("electron").remote;

    // Change window text
    const showText = (msg) => {
      document.getElementById("txtStatus").innerHTML = msg;
    };

    // Output error
    const alertError = (e) => {
      showText("Error");
      alert(e);
      ipcRenderer.send("close-app");
      throw new Error(e);
    };

    // Get config.json file
    let configFile;
    try {
      configFile = JSON.parse(fs.readFileSync(filePath + "/egu-config.json"));
    } catch (e) {
      alertError(e);
    }

    //
    // Check if isDev
    //
    const isDev = () => {
      return remote.process.argv[3] == "--dev";
    };
    //

    //
    // Close Window Button
    //
    document.getElementById("btnClose").addEventListener("click", () => {
      ipcRenderer.send("close-app");
    });
    //

    //
    // Start Game Button
    //
    document.getElementById("btnStart").addEventListener("click", () => {
      const { spawn } = require("child_process");
      spawn(configFile.startCmd, {
        cwd: filePath + "\\gc-client\\",
        detached: true,
        shell: true,
      });
      ipcRenderer.send("close-app");
    });
    //

    //
    // Files Arrays
    //
    let localFiles = [];
    let remoteFiles = [];
    //

    //
    // 'getUpdate' Function
    //
    const getUpdate = async () => {
      let url = configFile.updateList;

      let response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      let data = await response.json();
      return data;
    };

    //
    // 'getFiles' Function
    //
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
    //

    //
    // 'runUpdate' Function
    //
    const runUpdate = (r) => {
      remoteFiles = r;
      showText("Comparando arquivos");

      //
      // Compare local/remote files
      //
      getFiles(filePath + "\\gc-client\\").then((res) => {
        res.forEach((file) => {
          const size = fs.statSync(file).size;

          const specialFiles = ["main.exe", "stage/script.kom"];
          if (
            specialFiles.indexOf(
              file.replace(filePath + "\\gc-client\\", "").replace(/\\/g, "/")
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

        //
        // Filter remote paths (keep only file name)
        //
        remoteFiles.forEach((e) => {
          e.file =
            filePath +
            "\\gc-client\\" +
            JSON.stringify(e.file).replace(/"/g, "").replace(/\\\\/g, "\\");
        });
        //

        //
        // Get files that need to be updated
        //
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
        //

        //
        // 'update' Function
        //
        const { ipcRenderer } = require("electron");
        const update = () => {
          console.log(remoteFiles);
          // If there are items to update...
          if (remoteFiles.length > 0) {
            // get first file infos from array
            const url = remoteFiles[0].url;
            const name = remoteFiles[0].file.replace(/^.*[\\]/, "");
            const path = remoteFiles[0].file.replace(name, "");

            // delete old file before downloading new one
            if (fs.existsSync(path + name)) {
              fs.unlinkSync(path + name);
            }

            // download first file from array
            ipcRenderer.send("download", {
              url: url,
              options: {
                directory: path,
              },
            });

            // update status text
            showText("Baixando: " + name);
          } else {
            // update complete
            showText("Atualização concluída");
            document
              .getElementById("fileBar")
              .style.setProperty("width", "100%");
            document
              .getElementById("btnStartDisabled")
              .style.setProperty("display", "none");
            document
              .getElementById("totalBar")
              .style.setProperty("width", "100%");
            document.getElementById("txtProgress").innerHTML = "100%";
          }
        };
        //

        // Store total files sizes + downloaded bytes
        let downloadedSize = 0;
        const totalSize = remoteFiles
          .map((item) => item.size)
          .reduce((prev, curr) => prev + curr, 0);

        //
        // Call update function
        //
        update();
        //

        //
        // Download Progress
        //
        ipcRenderer.on("download progress", (event, status) => {
          const fileProgress = Math.floor(status.percent * 100);
          document
            .getElementById("fileBar")
            .style.setProperty("width", fileProgress + "%");
        });

        ipcRenderer.on("download complete", () => {
          downloadedSize += remoteFiles[0].size;
          // remove first file from array (since it has been successfully downloaded)
          remoteFiles.splice(0, 1);
          const totalProgress = Math.floor((downloadedSize * 100) / totalSize);
          document
            .getElementById("totalBar")
            .style.setProperty("width", totalProgress + "%");
          document.getElementById("txtProgress").innerHTML =
            totalProgress + "%";
          update();
        });

        ipcRenderer.on("download error", () => {
          // error
        });
      });
      //
    };
    //

    //
    // 'error' Function
    //
    const error = (e) => {
      alert("Failed to fetch update data: " + e);
      showText("Erro ao buscar dados da atualização");
      document.getElementById("fileBar").style.setProperty("width", "100%");
      document.getElementById("totalBar").style.setProperty("width", "100%");
      document.getElementById("txtProgress").innerHTML = "100%";
    };
    //

    //
    // Run Everything
    //
    // Check if main folder exists
    if (!fs.existsSync(filePath + "\\gc-client\\")) {
      fs.mkdirSync(filePath + "\\gc-client\\");
    }
    getUpdate()
      .then((r) => runUpdate(r))
      .catch((e) => error(e));
    //
  },
};
