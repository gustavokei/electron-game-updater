const showText = (element, msg) => {
    document.querySelector(element).innerHTML = msg;
}

module.exports = { showText };
