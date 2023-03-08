import type { Configuration } from 'webpack';
import CopyPlugin from 'copy-webpack-plugin'
import { rules } from './webpack.rules';
import path from 'path';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "src/renderer-app/**/*"), to: path.resolve(__dirname, '.webpack/renderer/main_window'), context: 'src/renderer-app/' },
        { from: path.resolve(__dirname, "src/app/**/*"), to: path.resolve(__dirname, '.webpack/main/static'), context: 'src/app/' },
      ],
    }),
  ]
};
