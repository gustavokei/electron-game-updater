const merge = require('webpack-merge');

module.exports = function (config) {
  config = merge.smart(config, {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: /node_modules/,
        },
      ],
    },
  });

  return config;
};
