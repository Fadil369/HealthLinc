const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/worker-optimized.ts',
  mode: isProduction ? 'production' : 'development',
  target: 'webworker',
  devtool: isProduction ? false : 'eval-source-map',
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.worker.json',
            transpileOnly: true,
            experimentalWatchApi: true,
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
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimize: isProduction,
    usedExports: true,
    sideEffects: false,
  },
  stats: {
    preset: 'minimal',
    colors: true,
    timings: true,
  },
  performance: {
    hints: false,
  },
};
