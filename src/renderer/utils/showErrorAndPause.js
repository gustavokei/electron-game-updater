const showErrorAndPause = (error) => {
    alert(error);
    document.getElementById("txtStatus").innerHTML = error;
    document.getElementById("fileBar").style.setProperty("width", "100%");
    document.getElementById("totalBar").style.setProperty("width", "100%");
    document.getElementById("txtProgress").innerHTML = "100%";
}

module.exports = { showErrorAndPause };
