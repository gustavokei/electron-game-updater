const addCacheBustingSuffix = (url) => {
    const randomNumber = Math.floor(Math.random() * 999) + 1;

    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}v=${randomNumber}`;
};

module.exports = { addCacheBustingSuffix };
