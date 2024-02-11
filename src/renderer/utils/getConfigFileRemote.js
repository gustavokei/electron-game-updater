const getConfigFileRemote = async (url) => {
    try {
        const response = await fetch(url);
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
