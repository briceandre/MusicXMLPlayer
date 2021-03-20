import NoteParser from "note-parser";

export class Synthetizer
{
   private is_loaded: boolean;
   private is_cleanup: boolean;
   private instruments: number[];
   private note_parser: any;
   
   private context: any;
   
   private playing: boolean;
   private shall_feed: boolean;
   private last_sent_finish_time: number|boolean;
   private periodic_function: function;
   private in_sending: boolean;
   
   private last_promise_id: number;
   private promises: any;
   
   private worker: any;
   
   private onLoadPromise: any;
   
   constructor()
   {
      /* Set internal data  */
      this.is_loaded = false;
      this.is_cleanup = false;
      this.instruments = [];
      this.note_parser = NoteParser();
      
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      
      this.playing = false;
      this.shall_feed = false;
      this.last_sent_finish_time = false;
      this.periodic_function = setInterval(this.onCyclic.bind(this), 100);
      this.in_sending = false;

      /* Set queue of promises under wait */
      this.last_promise_id = 0;
      this.promises = {};
      
      /* Initialise workers */
      this.worker = new Worker('/MusicXMLPlayer/dist/music-xml-player-worker.js');
      this.onLoadPromise = new Promise(function(resolve)
      {
         this.worker.onmessage = function(e)
         {
            if (e.data.type == 'initialised')
            {
               this.is_loaded = true;
               resolve(true);
            }
            else if (this.promises.hasOwnProperty(e.data.promise))
            {
               this.promises[e.data.promise](e.data.result);
               delete this.promises[e.data.promise];
            }
            else
            {
               console.log('Main thread : unknown command...');
               console.log(e)
            }
         }.bind(this)
      }.bind(this));
   }
   
   cleanup()
   {
      if (!this.is_cleanup)
      {
         this.is_cleanup = true;
         clearInterval(this.periodic_function);
         this.worker.terminate();
         this.context.close()
      }
   }
   
   waitReady(callback)
   {
      this.onLoadPromise.then(callback);
   }
   
   loadInstruments(instruments, _used_notes, callback)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      /* Check which instruments have not been loaded */
      var instruments_to_load = [];
      var instruments_url = []
      var used_notes = _used_notes;
      for (const i of instruments)
      {
         if ((!this.instruments.includes(i)) && (!instruments_to_load.includes(i)))
         {
            instruments_to_load.push(i);
            instruments_url.push("/samples/"+this.midiInstrumentsNames[i]+"-mp3.js")
         }
      }
      
      /* Check if we have at least one instrument to load */
      if (instruments_to_load.length <= 0)
      {
         callback();
         return
      }
      
      /* Format urls */
      requirejs(instruments_url, function() 
      {
         var promises = [];
         
         window.MIDI = window.MIDI || {};
         window.MIDI.parsed = window.MIDI.parsed || {};
         
         /* Perform full conversion of inputs */
         for (let i of instruments_to_load)
         {
            var filtered_notes = [];
            var tmp = Object.keys(used_notes[i])
            for (const t of tmp)
            {
               filtered_notes.push(this.note_parser.convert(t));
            }

            this.instruments.push(i);
            window.MIDI.parsed[this.midiInstrumentsNames[i]] = window.MIDI.parsed[this.midiInstrumentsNames[i]] || {};
            
            for (let note in window.MIDI.Soundfont[this.midiInstrumentsNames[i]])
            {
               if (filtered_notes.includes(this.note_parser.convert(note)))
               {
                  console.log('include '+note)
                  var f = function(d)
                  {
                     var channel_1 = d.getChannelData(channel_1, 0);
                     var channel_2 = d.getChannelData(channel_2, 1);

                     return this.internal_load_note(i, this.note_parser.convert(note), d.sampleRate, channel_1, channel_2);
                  }.bind(this);
                  promises.push(this.loadInstrumentsParser(window.MIDI.Soundfont[this.midiInstrumentsNames[i]][note], f.bind(this)))
               }
               else
               {
                  console.log('skip '+note)
               }
            }
         }

         /* Wait for all promises to resolve */
         Promise.all(promises).then(function()
         {
            callback();
         }.bind(this))
      }.bind(this));
   }
   
   GetReplayedInstruments()
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');

      /* Create a pointer to integer */
      var dataPtr = window.SynthetiserModule._malloc(4);
      var dataHeap = new Uint8Array(window.SynthetiserModule.HEAPU8.buffer, dataPtr, 4);
      dataHeap.set(new Int32Array([-1]))

      /* Perform the call */
      var buffer = this._GetReplayedInstruments(dataHeap.byteOffset);
      
      /* Retrieve nb elements */
      var nb_elements = (new Int32Array(window.SynthetiserModule.HEAP32.buffer, dataPtr, 1))[0]
      
      /* Free buffer */
      window.SynthetiserModule._free(dataPtr);
      
      /* Retrieve array */
      return new Int32Array(window.SynthetiserModule.HEAP32.buffer, buffer, nb_elements);
   }
   
   AddReplayedInstrument(instrument_id)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.AddReplayInstrument(instrument_id);
   }
   
   ClearAll()
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.ClearAll();
   }
   
   SetReplayedInstrumentVolume(replayed_instrument, volume)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.SetReplayedInstrumentVolume(replayed_instrument, volume);
   }
   
   SetReplayedInstrumentInstrument(replayed_instrument, instrument)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.SetReplayedInstrumentInstrument(replayed_instrument, instrument);
   }
   
   TriggerNote(replayed_instrument, note, offset, volume)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.TriggerNote(replayed_instrument, this.note_parser.convert(note), Math.floor(offset*this.context.sampleRate), volume);
   }
   
   ReleaseNote(replayed_instrument, note, offset)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.ReleaseNote(replayed_instrument, this.note_parser.convert(note), Math.floor(offset*this.context.sampleRate));
   }
   
   ReleaseAllNotes(replayed_instrument)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.ReleaseAllNotes(replayed_instrument);
   }
   
   GetNotesTriggered(replayed_instrument)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      /* Create a pointer to integer */
      var dataPtr = window.SynthetiserModule._malloc(4);
      var dataHeap = new Uint8Array(window.SynthetiserModule.HEAPU8.buffer, dataPtr, 4);
      dataHeap.set(new Int32Array([-1]))

      /* Perform the call */
      var buffer = this._GetNotesTriggered(replayed_instrument, dataHeap.byteOffset);
      
      /* Retrieve nb elements */
      var nb_elements = (new Int32Array(window.SynthetiserModule.HEAP32.buffer, dataPtr, 1))[0]
      
      /* Free buffer */
      window.SynthetiserModule._free(dataPtr);
      
      /* Retrieve array */
      return new Int32Array(window.SynthetiserModule.HEAP32.buffer, buffer, nb_elements);
   }
   
   start()
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      this.playing = true;
      this.shall_feed = true;
      this.feeded = false;
      this.duration = 0.5;
      this.last_sent_finish_time = this.context.currentTime;
      this.send_next_sample();
   }
   
   stop()
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      this.playing = false;
   }
   
   checkShallFeed()
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      if (this.shall_feed)
      {
         this.shall_feed = false;
         return true;
      }
      return false;
   }
   
   setFeededWithDuration(duration)
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      this.duration = duration;
      this.feeded = true;
      return this.last_sent_finish_time;
   }
   
   now()
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.context.currentTime;
   }

   invokeWorkerCommand = function(_name, _args)
   {
      var name = _name;
      var args = _args;
      return new Promise(function(resolve)
      {
         this.last_promise_id++;
         this.promises[this.last_promise_id] = resolve;
         this.worker.postMessage({'promise': this.last_promise_id,
                                  'type': name,
                                  'args': args});
      }.bind(this))
   }
   
   load_note = function(instrument_id, note, sample_rate, length, channel_1_data, channel_2_data) {return this.invokeWorkerCommand('load_note', [instrument_id, note, sample_rate, length, channel_1_data, channel_2_data])}

   AddReplayInstrument = function(instrument_id) {return this.invokeWorkerCommand('AddReplayedInstrument', [instrument_id])}
   ClearAll = function() {return this.invokeWorkerCommand('ClearAll', [])}

   SetReplayedInstrumentVolume = function(replayed_instrument, volume) {return this.invokeWorkerCommand('SetReplayedInstrumentVolume', [replayed_instrument, volume])}
   SetReplayedInstrumentInstrument = function(replayed_instrument, instrument) {return this.invokeWorkerCommand('SetReplayedInstrumentInstrument', [replayed_instrument, instrument])}

   TriggerNote = function(replayed_instrument, note, offset, volume) {return this.invokeWorkerCommand('TriggerNote', [replayed_instrument, note, offset, volume])}
   ReleaseNote = function(replayed_instrument, note, offset) {return this.invokeWorkerCommand('ReleaseNote', [replayed_instrument, note, offset])}
   ReleaseAllNotes = function(replayed_instrument) {return this.invokeWorkerCommand('ReleaseAllNotes', [replayed_instrument])}

   SampleDataToWorker = function(time) {return this.invokeWorkerCommand('SampleData', [time])}

   midiInstrumentsNames = ["acoustic_grand_piano",
                            "bright_acoustic_piano",
                            "electric_grand_piano",
                            "honkytonk_piano",
                            "electric_piano_1",
                            "electric_piano_2",
                            "harpsichord",
                            "clavinet",
                            "celesta",
                            "glockenspiel",
                            "music_box",
                            "vibraphone",
                            "marimba",
                            "xylophone",
                            "tubular_bells",
                            "dulcimer",
                            "drawbar_organ",
                            "percussive_organ",
                            "rock_organ",
                            "church_organ",
                            "reed_organ",
                            "accordion",
                            "harmonica",
                            "tango_accordion",
                            "acoustic_guitar_nylon",
                            "acoustic_guitar_steel",
                            "electric_guitar_jazz",
                            "electric_guitar_clean",
                            "electric_guitar_muted",
                            "overdriven_guitar",
                            "distortion_guitar",
                            "guitar_harmonics",
                            "acoustic_bass",
                            "electric_bass_finger",
                            "electric_bass_pick",
                            "fretless_bass",
                            "slap_bass_1",
                            "slap_bass_2",
                            "synth_bass_1",
                            "synth_bass_2",
                            "violin",
                            "viola",
                            "cello",
                            "contrabass",
                            "tremolo_strings",
                            "pizzicato_strings",
                            "orchestral_harp",
                            "timpani",
                            "string_ensemble_1",
                            "string_ensemble_2",
                            "synth_strings_1",
                            "synth_strings_2",
                            "choir_aahs",
                            "voice_oohs",
                            "synth_choir",
                            "orchestra_hit",
                            "trumpet",
                            "trombone",
                            "tuba",
                            "muted_trumpet",
                            "french_horn",
                            "brass_section",
                            "synth_brass_1",
                            "synth_brass_2",
                            "soprano_sax",
                            "alto_sax",
                            "tenor_sax",
                            "baritone_sax",
                            "oboe",
                            "english_horn",
                            "bassoon",
                            "clarinet",
                            "piccolo",
                            "flute",
                            "recorder",
                            "pan_flute",
                            "blown_bottle",
                            "shakuhachi",
                            "whistle",
                            "ocarina",
                            "lead_1_square",
                            "lead_2_sawtooth",
                            "lead_3_calliope",
                            "lead_4_chiff",
                            "lead_5_charang",
                            "lead_6_voice",
                            "lead_7_fifths",
                            "lead_8_basslead",
                            "pad_1_new_age",
                            "pad_2_warm",
                            "pad_3_polysynth",
                            "pad_4_choir",
                            "pad_5_bowed",
                            "pad_6_metallic",
                            "pad_7_halo",
                            "pad_8_sweep",
                            "fx_1_rain",
                            "fx_2_soundtrack",
                            "fx_3_crystal",
                            "fx_4_atmosphere",
                            "fx_5_brightness",
                            "fx_6_goblins",
                            "fx_7_echoes",
                            "fx_8_scifi",
                            "sitar",
                            "banjo",
                            "shamisen",
                            "koto",
                            "kalimba",
                            "bagpipe",
                            "fiddle",
                            "shanai",
                            "tinkle_bell",
                            "agogo",
                            "steel_drums",
                            "woodblock",
                            "taiko_drum",
                            "melodic_tom",
                            "synth_drum",
                            "reverse_cymbal",
                            "guitar_fret_noise",
                            "breath_noise",
                            "seashore",
                            "bird_tweet",
                            "telephone_ring",
                            "helicopter",
                            "applause",
                            "gunshot"]
 
   base64ToArrayBuffer = function(base64) 
   {
      var binary_string = window.atob(base64.slice(base64.lastIndexOf(',') + 1));
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
   }
   
   loadInstrumentsParser = function(b64_data, clbk)
   {
      return new Promise(function(resolve, reject)
      {
         var audioBuffer = this.context.decodeAudioData(this.base64ToArrayBuffer(b64_data), function(d)
         {
            clbk(d);
            resolve();
         });
      }.bind(this));
   }
   
   internal_load_note = function(instrument_id, note, sample_rate, channel_1_data, channel_2_data)
   {
      return this.load_note(instrument_id, note, sample_rate, channel_1_data.length, channel_1_data, channel_2_data);
   }
   
   SampleData = function(time)
   {
      /* Compute number of elements */
      var nb_samples = Math.floor(this.context.sampleRate*time);
      
      /* Perform the call */
      return this.SampleDataToWorker(nb_samples);
   }
   
   send_next_sample = function()
   {
      console.log('send next sample')
      this.in_sending = true;
      
      console.log('Send next sample...')
      /* Check if we have data */
      if (this.feeded)
      {
         console.log('   -> real sample')
         /* Sample next duration */
         console.log('Request data...')
         this.SampleData(this.duration).then(function(data)
         {
            console.log('Data received -> push in soundcard');
            var buffer = this.context.createBuffer(2, this.duration*this.context.sampleRate, this.context.sampleRate);
            
            this.shall_feed = true;
            
            /* feed in buffer */
            var b1 = buffer.getChannelData(0);
            var b2 = buffer.getChannelData(1);
            
            for (var i = 0; i < buffer.length; i++)
            {
               b1[i] = data[0][i];
               b2[i] = data[1][i];
            }
            
            /* Send it to sound card */
            var source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(this.last_sent_finish_time);
            
            /* Update local time */
            this.last_sent_finish_time += this.duration;
            this.in_sending = false;
         }.bind(this))
      }
      else
      {
         console.log('   -> blank')
         var buffer = this.context.createBuffer(2, this.duration*this.context.sampleRate, this.context.sampleRate);
         
         /* set blank duration */
         var b1 = buffer.getChannelData(0);
         var b2 = buffer.getChannelData(1);
         
         for (var i = 0; i < buffer.length; i++)
         {
            b1[i] = 0;
            b2[i] = 0;
         }
         
         /* Send it to sound card */
         var source = this.context.createBufferSource();
         source.buffer = buffer;
         source.connect(this.context.destination);
         source.start(this.last_sent_finish_time);
         
         /* Update local time */
         this.last_sent_finish_time += this.duration;
         this.in_sending = false;
      }
   }
   
   onCyclic = function()
   {
      /* Run only of we are playing */
      if (!this.playing) return;
      
      /* Check that we are not in sending stuff */
      if (this.in_sending) return;
      
      /* We send next sample only half second before expiration */
      if ((this.last_sent_finish_time-1.0) <= this.context.currentTime)
      {
         this.send_next_sample();
      }
   }
}
