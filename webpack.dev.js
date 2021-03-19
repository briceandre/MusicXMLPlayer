const path = require('path');
var merge = require('webpack-merge')
var common = require('./webpack.config.js')

module.exports = merge(common, 
{
   output: 
   {
      filename: 'music-xml-player.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'umd',
   },
   mode: 'development',
});
