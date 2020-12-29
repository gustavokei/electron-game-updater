module.exports = {
  patcher: () => {
    const { ipcRenderer } = require("electron");
    const filePath = ipcRenderer.sendSync("get-file-path", "");
    const remote = require("electron").remote;

    //
    // Check if isDev
    //
    const isDev = () => {
      return remote.process.argv[3] == "--dev";
    };
    //

    const changeLauncherStatus = (msg) => {
      document.getElementById("txtStatus").innerHTML = msg;
    };

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
      spawn("start main.exe __kogstudios_original_service__", {
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
    let localArray = [];
    let remoteArray = [];
    //

    //
    // 'getUpdate' Function
    //
    const getUpdate = async () => {
      let url = "https://storage.googleapis.com/gc-client/gc-launcher.json";

      if (isDev()) {
        url =
          "https://cors-anywhere.herokuapp.com/https://storage.googleapis.com/gc-client/gc-launcher.json";
      }

      let response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      let data = await response.json();
      //console.log('cloud json: ' + JSON.stringify(data));
      return data;
    };

    //
    // 'getFiles' Function
    //
    const path = require("path");
    const getFiles = async (dir, fileList = []) => {
      const fs = require("fs").promises;
      const files = await fs.readdir(dir);
      for (const file of files) {
        const stat = await fs.stat(path.join(dir, file));
        if (stat.isDirectory())
          fileList = await getFiles(path.join(dir, file), fileList);
        else fileList.push(path.join(dir, file));
      }
      return fileList;
    };
    //

    //
    // 'runUpdate' Function
    //
    const runUpdate = (r) => {
      remoteArray = r;
      // console.log("remoteArray: " + JSON.stringify(remoteArray));
      changeLauncherStatus("Comparando arquivos");

      //
      // Compare local/remote files
      //
      getFiles(filePath + "\\gc-client\\").then((res) => {
        res.forEach((file) => {
          const size = fs.statSync(file).size;

          const specialFiles = ["main.exe", "stage/script.kom"];
          if (
            specialFiles.indexOf(
              file
                .replace(process.env.PORTABLE_EXECUTABLE_DIR + "\\", "")
                .replace(/\\/g, "/")
            ) > -1
          ) {
            const hash = require("crypto")
              .createHash("sha1")
              .update(fs.readFileSync(file))
              .digest("base64");
            file = localArray.push({ file, size, hash });
          } else {
            file = localArray.push({ file, size });
          }
        });

        // console.log("localArray: " + JSON.stringify(localArray));

        //
        // Filter remote paths (keep only file name)
        //
        remoteArray.forEach((e) => {
          e.file =
            filePath +
            "\\gc-client\\" +
            JSON.stringify(e.file).replace(/"/g, "").replace(/\\\\/g, "\\");
        });
        //

        //
        // Get files that need to be updated
        //
        for (var i = 0; i < localArray.length; i++) {
          for (var j = 0; j < remoteArray.length; j++) {
            if (
              localArray[i].hash != undefined &&
              localArray[i].hash == remoteArray[j].hash
            ) {
              remoteArray.splice(j, 1);
              break;
            } else if (
              localArray[i].file == remoteArray[j].file &&
              localArray[i].size == remoteArray[j].size &&
              localArray[i].hash == undefined
            ) {
              remoteArray.splice(j, 1);
              break;
            }
          }
        }
        //

        // console.log("localArray: " + JSON.stringify(localArray));
        // console.log("updateArray: " + JSON.stringify(remoteArray));
        //console.log('updateArray.length: ' + remoteArray.length);

        //
        // 'update' Function
        //
        const { ipcRenderer } = require("electron");
        const update = () => {
          // If there are items to update...
          if (remoteArray.length > 0) {
            // get first file infos from array
            const url = remoteArray[0].url;
            const name = remoteArray[0].file.replace(/^.*[\\]/, "");
            const path = remoteArray[0].file.replace(name, "");

            // delete old file before downloading new one
            const fs = require("fs");
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
            changeLauncherStatus("Baixando: " + name);

            //console.log('Hows array: ' + JSON.stringify(remoteArray));
          } else {
            // update complete
            changeLauncherStatus("Atualização concluída");
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
        const totalSize = remoteArray
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
          // console.log(status);
        });

        ipcRenderer.on("download complete", () => {
          downloadedSize += remoteArray[0].size;
          // remove first file from array
          remoteArray.splice(0, 1);
          //console.log('downloaded: ' + downloadedSize);
          const totalProgress = Math.floor((downloadedSize * 100) / totalSize);
          document
            .getElementById("totalBar")
            .style.setProperty("width", totalProgress + "%");
          document.getElementById("txtProgress").innerHTML =
            totalProgress + "%";
          update();
        });

        ipcRenderer.on("download error", () => {
          // Retry update
          // update();
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
      changeLauncherStatus("Erro ao buscar dados da atualização");
      document.getElementById("fileBar").style.setProperty("width", "100%");
      document.getElementById("totalBar").style.setProperty("width", "100%");
      document.getElementById("txtProgress").innerHTML = "100%";
    };
    //

    //
    // Run Everything
    //
    const fs = require("fs");
    if (!fs.existsSync(filePath + "\\gc-client\\")) {
      fs.mkdirSync(filePath + "\\gc-client\\");
    }
    getUpdate()
      .then((r) => runUpdate(r))
      .catch((e) => error(e));
    //
  },
};
