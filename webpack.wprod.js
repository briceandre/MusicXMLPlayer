const path = require('path');

module.exports =
{
   entry: './worker/index.ts',
   devtool: 'source-map',
   output: 
   {
      filename: 'music-xml-player-worker.min.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'umd',
   },
   mode: 'production',
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
         },
      ],
   },
   resolve: 
   {
      extensions: [ '.tsx', '.ts', '.js' ],
   },
};