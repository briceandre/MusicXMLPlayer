module.exports =
{
   entry: ['./src/Synthetizer.ts', './src/MusicXMLPlayer.ts'],
   devtool: 'source-map',
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