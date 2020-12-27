const merge = require('webpack-merge');

module.exports = function (config) {
  config = merge.smart(config, {
    output: {
      publicPath: '',
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: /node_modules/,
          use: ['react-hot-loader/webpack'],
        },
      ],
    },
  });

  return config;
};
