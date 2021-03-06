# MusicXMLPlayer

This project allows playing MusicXML partitions in a web-browser. It is designed to be fast and limit resources usage, allowing execution in real-time on small devices (tested on old iphones devices).

## Demo

You can try our live demo at https://www.musician.cafe/MusicXMLPlayer/demo/index.html

## Usage

see our demo for example.

First, create an instance of MusicXMLPlayer with your MusicXML file:
```javascript
var player = new MusicXMLPlayer(mxl_file_content);
```
You must then wait for data to be loaded. You can retrieve a Promise with following method : 
```javascript
player.waitReady().then(function()
{
    ...
});
```
Once loaded, you can interact with the player with following commands:
```javascript
player.start(on_measure_change_callback, on_finished_callback);
player.pause();
player.stop();

player.setReplayInstrument(voice, instrument);
player.setReplayVolume(voice, volume);

player.setTempo(bpm);

player.moveToMeasure(measure_id);
```

Once you have finished with the player, do not forget to release the resources :
```javascript
player.cleanup();
```

## Features

Current implementation has limited features. Will be improved in future releases...

Do not hesitate to contribute ! Patches are welcome !

## License

This software is released under the MIT license

## Credits

This project uses the following resources :

- require.js : https://github.com/requirejs/requirejs/blob/master/LICENSE
- jszip : https://raw.github.com/Stuk/jszip/master/LICENSE.markdown
- NoteParser : https://www.npmjs.com/package/noteparser

The library needs SoundFont samples to work properly. By default, it uses Musyng Kite Soundfont. This behavior can be changed by providing another download URL to the constructor of MusicXMLPlayer :

- https://github.com/gleitz/midi-js-soundfonts
