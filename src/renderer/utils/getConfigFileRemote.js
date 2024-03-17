const { addCacheBustingSuffix } = require("./addCacheBustingSuffix");

const getConfigFileRemote = async (url) => {
    try {
        const urlWithCacheBusting = addCacheBustingSuffix(url);
        const response = await fetch(urlWithCacheBusting);
        if (!response.ok) {
            throw new Error('Failed to fetch JSON');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching JSON:', error.message);
        return null;
    }
};

module.exports = { getConfigFileRemote };
