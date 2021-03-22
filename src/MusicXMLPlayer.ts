import {Synthetizer} from './Synthetizer.ts';

declare class JSZip 
{
  constructor();
  loadAsync(arg: string): any;
}

export class MusicXMLPlayer
{
   private synth: Synthetizer;
   private data: any;
   
   private tempo: number;
   
   private is_cleaned_up: boolean;
   
   private is_playing: boolean;
   private is_loaded: boolean;
   private playing_info: {measures_attributes: {division: number, beats: number, beat_type: number},
                           playing_notes: {[index: number]:string[]}}[];
   private next_measure_to_send: number;
   
   private on_cyclic_callback: number;
   
   private selected_instruments: number[];
   private selected_replayed_instruments: number[];
   
   private on_play_measure: (arg0: number) => void;
   private on_stop: () => void;
   
   private onLoadPromise: Promise<void>;
   private onLoadPromiseResolve: any;
   
   constructor(mxl: string, sample_base_url: string="https://gleitz.github.io/midi-js-soundfonts/MusyngKite/")
   {
      this.synth = new Synthetizer(sample_base_url);
      this.data = false; 

      this.tempo = 80;
      
      this.is_cleaned_up = false;
      
      this.is_playing = false;
      this.is_loaded = false;
      this.playing_info = [];
      this.next_measure_to_send = 0;
      
      this.selected_instruments = [];
      this.selected_replayed_instruments = [];
      
      this.on_cyclic_callback = setInterval(this.OnCyclic.bind(this), 100);
      
      this.on_play_measure = function(a: number){}
      this.on_stop = function() {}

      this.onLoadPromise = new Promise(this.OnLoadPromiseInitialised.bind(this, mxl));
   }
   
   private OnLoadPromiseInitialised(mxl: string, resolve: () => void): void
   {
      this.onLoadPromiseResolve = resolve;
      this.synth.waitReady(this.loadNotes.bind(this, mxl))
   }
   
   cleanup(): void
   {
      if (!this.is_cleaned_up)
      {
         this.is_cleaned_up = true;
         
         clearInterval(this.on_cyclic_callback);
         
         this.is_loaded = false;
         this.is_playing = false;
         this.playing_info = [];
         this.next_measure_to_send = 0;

         this.on_play_measure = function(a: number){}
         this.on_stop = function() {}
         
         this.synth.cleanup();
      }
   }
   
   waitReady(): Promise<void>
   {
      return this.onLoadPromise;
   }
   
   static getAvailableInstruments(): string[]
   {
      return ["Acoustic Grand Piano",
              "Bright Acoustic Piano",
              "Electric Grand Piano",
              "Honky-tonk Piano",
              "Electric Piano 1",
              "Electric Piano 2",
              "Harpsichord",
              "Clavi",
              "Celesta",
              "Glockenspiel",
              "Music Box",
              "Vibraphone",
              "Marimba",
              "Xylophone",
              "Tubular Bells",
              "Dulcimer",
              "Drawbar Organ",
              "Percussive Organ",
              "Rock Organ",
              "Church Organ",
              "Reed Organ",
              "Accordion",
              "Harmonica",
              "Tango Accordion",
              "Acoustic Guitar (nylon)",
              "Acoustic Guitar (steel)",
              "Electric Guitar (jazz)",
              "Electric Guitar (clean)",
              "Electric Guitar (muted)",
              "Overdriven Guitar",
              "Distortion Guitar",
              "Guitar harmonics",
              "Acoustic Bass",
              "Electric Bass (finger)",
              "Electric Bass (pick)",
              "Fretless Bass",
              "Slap Bass 1",
              "Slap Bass 2",
              "this.synth Bass 1",
              "this.synth Bass 2",
              "Violin",
              "Viola",
              "Cello",
              "Contrabass",
              "Tremolo Strings",
              "Pizzicato Strings",
              "Orchestral Harp",
              "Timpani",
              "String Ensemble 1",
              "String Ensemble 2",
              "this.synthStrings 1",
              "this.synthStrings 2",
              "Choir Aahs",
              "Voice Oohs",
              "this.synth Choir",
              "Orchestra Hit",
              "Trumpet",
              "Trombone",
              "Tuba",
              "Muted Trumpet",
              "French Horn",
              "Brass Section",
              "this.synthBrass 1",
              "this.synthBrass 2",
              "Soprano Sax",
              "Alto Sax",
              "Tenor Sax",
              "Baritone Sax",
              "Oboe",
              "English Horn",
              "Bassoon",
              "Clarinet",
              "Piccolo",
              "Flute",
              "Recorder",
              "Pan Flute",
              "Blown Bottle",
              "Shakuhachi",
              "Whistle",
              "Ocarina",
              "Lead 1 (square)",
              "Lead 2 (sawtooth)",
              "Lead 3 (calliope)",
              "Lead 4 (chiff)",
              "Lead 5 (charang)",
              "Lead 6 (voice)",
              "Lead 7 (fifths)",
              "Lead 8 (bass + lead)",
              "Pad 1 (new age)",
              "Pad 2 (warm)",
              "Pad 3 (polythis.synth)",
              "Pad 4 (choir)",
              "Pad 5 (bowed)",
              "Pad 6 (metallic)",
              "Pad 7 (halo)",
              "Pad 8 (sweep)",
              "FX 1 (rain)",
              "FX 2 (soundtrack)",
              "FX 3 (crystal)",
              "FX 4 (atmosphere)",
              "FX 5 (brightness)",
              "FX 6 (goblins)",
              "FX 7 (echoes)",
              "FX 8 (sci-fi)",
              "Sitar",
              "Banjo",
              "Shamisen",
              "Koto",
              "Kalimba",
              "Bag pipe",
              "Fiddle",
              "Shanai",
              "Tinkle Bell",
              "Agogo",
              "Steel Drums",
              "Woodblock",
              "Taiko Drum",
              "Melodic Tom",
              "this.synth Drum",
              "Reverse Cymbal",
              "Guitar Fret Noise",
              "Breath Noise",
              "Seashore",
              "Bird Tweet",
              "Telephone Ring",
              "Helicopter",
              "Applause",
              "Gunshot"]
   }

   setReplayInstrument(voice_id: number, instrument_id: number): void
   {
      var notes_to_load = this.getNotes();
      
      var notes_of_instrument: {[index: number]:{[index: string]:boolean}} = {}
      notes_of_instrument[instrument_id] = notes_to_load[parseInt(this.data['score-partwise'][0]['part-list']['score-part'][voice_id]['midi-instrument']['midi-program'])-1]
      this.synth.loadInstruments([instrument_id], notes_of_instrument, function()
      {
         this.synth.SetReplayedInstrumentInstrument(this.selected_replayed_instruments[voice_id], instrument_id);
      }.bind(this))
   }
   
   setReplayVolume(voice_id: number, volume: number): void
   {
      this.synth.SetReplayedInstrumentVolume(this.selected_replayed_instruments[voice_id], volume);
   }
   
   private loadInstruments(instruments: number[], callback: () => void): void
   {
      /* Extract notes needed */
      this.synth.loadInstruments(instruments, this.getNotes(), callback)
   }
   
   getInstruments(): {name: string, instrument_id: number}[]
   {
      var instruments = []
      for (const i of this.data['score-partwise'][0]['part-list']['score-part'])
      {
         instruments.push({name: i['part-name'], instrument_id: parseInt(i['midi-instrument']['midi-program'])-1});
      }
      return instruments;
   }
   
   private OnNotesLoaded(data: any)
   {
      this.data = data;
      
      this.selected_instruments = [];
      this.selected_replayed_instruments = [];
      var tmp = this.getInstruments();
      for (var i = 0; i < tmp.length; i++)
      {
         this.selected_instruments.push(tmp[i].instrument_id);
      }
      
      /* Ensure we have instruments */
      this.synth.ClearAll();
      this.loadInstruments(this.selected_instruments, this.OnInstrumentsLoded.bind(this, tmp));
   }
   
   private OnInstrumentsLoded(instruments: {name: string, instrument_id: number}[]): void
   {
      /* Push replayed instruments */
      this.selected_replayed_instruments = [];
      for (var i = 0; i < instruments.length; i++)
      {
         this.synth.AddReplayedInstrument(instruments[i].instrument_id).then(function(r: number){this.selected_replayed_instruments.push(r)}.bind(this))
      }

      /* Notify end of load */
      this.onLoadPromiseResolve();
   }
   
   setTempo(t: number): void
   {
      this.tempo = t;
   }

   private resetPlayingInfo(): void
   {
      this.playing_info = [];
      for (var i = 0; i < this.selected_instruments.length; i++)
      {
         this.playing_info.push({'measures_attributes': {'division': 1, 'beats': 1, 'beat_type': 1},
                                 'playing_notes': {}})
      }
   }
   
   start(on_play_measure: (arg0: number) => void, on_stop: () => void): void
   {
      /* Start this.synth to be sure we take the audiocontext */
      this.synth.start();
      
      /* launch the engine */
      this.on_play_measure = on_play_measure;
      this.on_stop = on_stop;
      
      if (!this.is_loaded)
      {
         /* Reset playing info */
         this.resetPlayingInfo();
         
         /* Reset internal state */
         this.is_playing = true;
         this.is_loaded = true;
      }
      else
      {
         this.is_playing = true;
      }
   }
   
   moveToMeasure(measure_id: number): void
   {
      this.next_measure_to_send = measure_id-1;
   }
   
   pause(): void
   {
      this.synth.stop();
      this.is_playing = false;
   }
   
   stop(): void
   {
      this.synth.stop();
      this.is_playing = false;
      this.resetPlayingInfo();
      this.next_measure_to_send = 0;
   }
   
   private ComputeNoteSymbol(pitch: any): string
   {
      var note_symbol = pitch.step
      if (pitch.alter && (pitch.alter == '-1'))
      {
         note_symbol += 'b'
      }
      else if (pitch.alter && (pitch.alter == '-2'))
      {
         note_symbol += 'bb'
      }
      else if (pitch.alter && (pitch.alter == '1'))
      {
         note_symbol += '#'
      }
      else if (pitch.alter && (pitch.alter == '2'))
      {
         note_symbol += 'x'
      }
      note_symbol += pitch.octave;
      return note_symbol;
   }
   
   private PlayVoice(voice: number, instrument: number, note_data: any, instrument_id: number, measure_id: number): number
   {
      let measure = note_data[instrument_id].measure[measure_id];

      var current_note_start = 0;
      var last_note_duration = 0;
      
      /* 
       * Check all notes that we shall stop at begin of measure
       * Note that notes that must be released in the middle of the measure will be managed after.
       * Note also that this code is defensive : should never occur...
       */
      var notes_to_stop: string[] = [];
      if (voice in this.playing_info[instrument_id].playing_notes)
      {
         notes_to_stop = this.playing_info[instrument_id].playing_notes[voice]
      }
      var remaining_notes_to_stop = [];
      for (const note_to_stop of notes_to_stop)
      {
         /* Check if we can find it */
         var shall_keep = false;
         for (let entry of measure.entry)
         {
            if ((voice == entry.voice) &&
                (entry.type == 'note') && 
                (entry.pitch) && 
                (this.ComputeNoteSymbol(entry.pitch) == note_to_stop))
            {
               /* Check if we shall keep it start */
               if (entry.tie)
               {
                  shall_keep = true;
               }
            }                            
         }
         
         /* Check if we keep it on */
         if (shall_keep)
         {
            /* Push it in remaining notes */
            remaining_notes_to_stop.push(note_to_stop);
         }
         else
         {
            /* Stop it */
            this.synth.ReleaseNote(instrument, note_to_stop, 0);
         }
      }
      this.playing_info[instrument_id].playing_notes[voice] = remaining_notes_to_stop;
      
      /* plan all notes */
      for (let entry of measure.entry)
      {
         if (voice == entry.voice)
         {
            /* Check for duration */
            var current_note_duration = 0;
            if (entry.duration)
            {
               current_note_duration = (this.playing_info[instrument_id].measures_attributes.beat_type/4)*((60/this.tempo)/this.playing_info[instrument_id].measures_attributes.division)*entry.duration;
            }
            
            if (entry.type == 'forward')
            {
               current_note_start += last_note_duration;
               last_note_duration = current_note_duration;
            }
            else if (entry.type == 'note')
            {
               if (!current_note_duration)
               {
                  //TODO : ornament note -> currently, we skip them
               }
               else
               {
                  var shall_start = true;
                  var shall_stop = true;
                  
                  var note_symbol = '_'
                  if (entry.pitch)
                  {
                     note_symbol = this.ComputeNoteSymbol(entry.pitch);
                  }
                  
                  if (!entry.chord)
                  {
                     current_note_start += last_note_duration;
                     last_note_duration = current_note_duration;
                  }
                  
                  if (entry.tie)
                  {
                     var is_start = false;
                     for (const tie of entry.tie)
                     {
                        if (tie.type == 'start')
                        {
                           is_start = true;
                        }
                     }
                     
                     /* 
                      * Check if we must start it.
                      * Note that, even if this is a stop, if note was not triggered, we start it if not played
                      * and we will switch it off at the end of the note
                      */
                     if (this.playing_info[instrument_id].playing_notes[voice].includes(note_symbol))
                     {
                        shall_start = false;
                     }
                     
                     /* Check if we must stop if */
                     if (is_start)
                     {
                        shall_stop = false;
                        if (!this.playing_info[instrument_id].playing_notes[voice].includes(note_symbol))
                        {
                           this.playing_info[instrument_id].playing_notes[voice].push(note_symbol)
                        }
                     }
                     else
                     {
                        if (this.playing_info[instrument_id].playing_notes[voice].includes(note_symbol))
                        {
                           this.playing_info[instrument_id].playing_notes[voice].splice(this.playing_info[instrument_id].playing_notes[voice].indexOf(note_symbol), 1)
                        }
                     }
                  }
                  
                  if (entry.pitch)
                  {
                     if (shall_start && shall_stop)
                     {
                        this.synth.TriggerNote(instrument, note_symbol, current_note_start, 1.0);
                        this.synth.ReleaseNote(instrument, note_symbol, current_note_start+current_note_duration);
                     }
                     else if (shall_start)
                     {
                        this.synth.TriggerNote(instrument, note_symbol, current_note_start, 1.0);
                     }
                     else if (shall_stop)
                     {
                        this.synth.ReleaseNote(instrument, note_symbol, current_note_start+current_note_duration);
                     }
                  }
               }
            }
         }
      }
      
      return current_note_start + current_note_duration;
   }
   
   private PlayInstrument(instrument: number, note_data: any, instrument_id: number, measure_id: number): number
   {
      let measure = note_data[instrument_id].measure[measure_id];

      /* Upate attributes */
      if (measure.attributes)
      {
         for (const attribute of measure.attributes)
         {
            if (attribute.divisions) {this.playing_info[instrument_id].measures_attributes.division = attribute.divisions};
            if (attribute.time)
            {
               if (attribute.time['beat-type']) this.playing_info[instrument_id].measures_attributes.beat_type = attribute.time['beat-type'];
               if (attribute.time['beats']) this.playing_info[instrument_id].measures_attributes.beats = attribute.time['beats'];
            }
         }
      }

      /* Get all voices */
      var voices: number[] = []
      for (let entry of measure.entry)
      {
         if (!voices.includes(entry.voice)) voices.push(entry.voice);
      }                   
      
      /* Play the voices */
      var measure_duration = 0;
      for (let voice of voices)
      {
         var duration = this.PlayVoice(voice, instrument, note_data, instrument_id, measure_id);
         if (measure_duration)
         {
            if (duration > measure_duration) measure_duration = duration;
         }
         else
         {
            measure_duration = duration;
         }
      }
      return measure_duration;
   }
   
   private TriggerOnMeasure(measure_id: number): void
   {
      this.on_play_measure(measure_id);
   }
   
   private PlayMeasure(): void
   {
      /* play the instruments */
      var measure_duration = 0;
      for (var id = 0; id < this.selected_instruments.length; id++)
      {
         var d = this.PlayInstrument(this.selected_replayed_instruments[id], this.data['score-partwise'][0].part, id, this.next_measure_to_send);
         if (measure_duration)
         {
            if (measure_duration < d) measure_duration = d;
         }
         else
         {
            measure_duration = d
         }
      }
      
      /* Confirm the sending of the measure */
      var measure_start_time = this.synth.setFeededWithDuration(measure_duration)
      
      /* Send callback */
      var measure_played = this.next_measure_to_send+1;
      setTimeout(this.TriggerOnMeasure.bind(this, measure_played), (measure_start_time-this.synth.now())*1000);

      /* Check if we still have something to play */
      if ((this.next_measure_to_send < (this.data['score-partwise'][0].part[0].measure.length-1)))
      {
         /* Update internal data */
         this.next_measure_to_send++;
      }
      else
      {
         /* stop the play */
         this.is_playing = false;
         this.resetPlayingInfo();
         this.next_measure_to_send = 0;
         
         /* Send the callback */
         setTimeout(this.on_stop, (measure_start_time+measure_duration-this.synth.now())*1000);
      }
   }
   
   private getNotes(): {[index: number]:{[index: string]:boolean}}
   {
      var notes:{[index: number]:{[index: string]:boolean}} = {}
      var instrument = 0;
      for (let part of this.data['score-partwise'][0].part)
      {
         for (let measure of part.measure)
         {
            for (let entry of measure.entry)
            {
               if ((entry.type == 'note') && 
                   (entry.pitch))
               {
                  var note = this.ComputeNoteSymbol(entry.pitch);
                  var i = this.selected_instruments[instrument]
                  
                  notes[i] = notes[i] || {};
                  notes[i][note] = true;
               }
            }
         }
         instrument++;
      }
      return notes;
   }
   
   private OnCyclic(): void
   {
      if (this.is_playing && 
          this.synth.checkShallFeed())
      {
         this.PlayMeasure();
      }
   }
   
   private loadNotes(mxl: string): void
   {
      /* Extract XML */
      this.extractXML(mxl)
   }
   
   private OnXMLExtracted(xml: string): void
   {
      var attributes_filter:{[index: string]:{[index: string]:string}} = 
         {'part': {'id': 'id'},
          'tie': {'type': 'type'}}
      var array_nodes: string[] =
         ['score-partwise', 'score-part', 'part', 'measure', 'note', 'attributes', 'forward', 'tie']
      var children_filter: {[index: string]:any} = 
         {'root': {'score-partwise': {}},
          'score-partwise': {'part-list': {}, 'part': {}},
          'part-list': {'score-part': {}},
          'score-part': {'part-name': {}, 'midi-instrument': {}},
          'part-name': {'@text': {}},
          'midi-instrument': {'midi-program': {}},
          'midi-program': {'@text': {}},
          'part': {'measure': {}},
          'measure': {'attributes': {}, 'note': {'export_name': 'entry', 'attributes': [{'name': 'type', 'value': 'note'}]}, 'forward': {'export_name': 'entry', 'attributes': [{'name': 'type', 'value': 'forward'}]}},
          'attributes': {'divisions': {}, 'time': {}, 'transpose': {}},
          'divisions': {'@text': {}},
          'time': {'beats': {}, 'beat-type': {}},
          'beats': {'@text': {}},
          'beat_type': {'@text': {}},
          'transpose': {'diatonic': {}, 'chromatic': {}, 'octave-change': {}},
          'diatonic': {'@text': {}},
          'chromatic': {'@text': {}},
          'octave-change': {'@text': {}},
          'note': {'rest': {}, 'pitch': {}, 'duration': {}, 'tie': {}, 'chord': {}, 'voice': {}},
          'rest': {},
          'pitch': {'step': {}, 'octave': {}, 'alter': {}},
          'step': {'@text': {}},
          'octave': {'@text': {}},
          'duration': {'@text': {}},
          'tie': {},
          'forward': {'duration': {}, 'voice': {}}}

      function xmlToJson(xml: any, node_parent: string)
      {
         // Create the return object
         var obj: any = {};

         if (xml.nodeType == 1) 
         {
            for (var j = 0; j < xml.attributes.length; j++)
            {
               var attribute = xml.attributes.item(j);
               if (attributes_filter[node_parent] && attributes_filter[node_parent][attribute.nodeName])
               {
                  obj[attributes_filter[node_parent][attribute.nodeName]] = attribute.nodeValue;
               }
            }
         }
         else if (xml.nodeType == 3)
         {
            return false;
         }

         var textNodes: any = [].slice.call(xml.childNodes).filter(function(node: any)
         {
            return node.nodeType === 3;
         });
         if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length)
         {
            obj = [].slice.call(xml.childNodes).reduce(function(text: string, node: any)
            {
               return text + node.nodeValue;
            }, "");
         }
         else if (xml.hasChildNodes())
         {
            for (var i = 0; i < xml.children.length; i++)
            {
               
               var item = xml.children.item(i);
               var nodeName = item.nodeName;
               if (children_filter[node_parent] && (nodeName in children_filter[node_parent]))
               {
                  var export_name = nodeName
                  if (children_filter[node_parent][nodeName]['export_name'])
                  {
                     export_name = children_filter[node_parent][nodeName]['export_name']
                  }

                  var value = xmlToJson(item, nodeName)
                  if (children_filter[node_parent][nodeName]['attributes'])
                  {
                     for (const a of children_filter[node_parent][nodeName]['attributes'])
                     {
                        value[a.name] = a.value;
                     }
                  }
                  
                  if (typeof obj[export_name] == "undefined")
                  {
                     if (array_nodes.includes(nodeName))
                     {
                        obj[export_name] = [value];
                     }
                     else
                     {
                        obj[export_name] = value;
                     }
                  }
                  else
                  {
                     if (typeof obj[export_name].push == "undefined")
                     {
                        var old = obj[nodeName];
                        obj[export_name] = [];
                        obj[export_name].push(old);
                     }
                     
                     obj[export_name].push(value);
                  }
               }
            }
         }
         return obj;
      }
      
      /* Perform a filtered conversion */
      var json_data = xmlToJson(new DOMParser().parseFromString(xml, 'text/xml'), 'root');
      
      /* Extract parts */
      this.OnNotesLoaded(json_data);
   }
   
   private OnXMLManifestLoaded(zip: any, data: string): void
   {
      /* Retrieve main file */  
      var main_file = (new DOMParser()).parseFromString(data, "text/xml").getElementsByTagName('rootfile')[0].getAttribute('full-path') ;

      /* Extract it */
      zip.file(main_file).async("string").then(this.OnXMLExtracted.bind(this));
   }
   
   private OnXMLLoaded(zip: any): void
   {
      zip.file("META-INF/container.xml").async("string").then(this.OnXMLManifestLoaded.bind(this, zip));
   }
   
   private extractXML(mxl: string): void
   {
      /* Unzip */
      var z = new JSZip();
      z.loadAsync(mxl).then(this.OnXMLLoaded.bind(this));
   }
}