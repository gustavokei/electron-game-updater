const addCacheBustingSuffix = (url) => {
    const randomNumber = Math.random();

    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}v=${randomNumber}`;
};

module.exports = { addCacheBustingSuffix };
