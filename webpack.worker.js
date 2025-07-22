const path = require('path');

module.exports = {
  entry: './src/worker-optimized.ts',
  mode: 'production',
  target: 'webworker',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.worker.json',
            transpileOnly: true
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
    globalObject: 'this',
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimize: true,
  },
};
