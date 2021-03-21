declare global {
  interface Window {
    webkitAudioContext: any;
    MIDI: any;
  }
  function requirejs(arg0: string[], arg1: Function): void
  function NoteParser(): any
  function requirejs(arg_: string[], arg1: () => void): void
}

export class Synthetizer
{
   private is_loaded: boolean;
   private is_cleanup: boolean;
   private instruments: number[];
   private note_parser: any;
   
   private context: any;
   
   private playing: boolean;
   private shall_feed: boolean;
   private last_sent_finish_time: number;
   private periodic_function: number;
   private in_sending: boolean;
   private feeded: boolean;
   private duration: number;
   
   private last_promise_id: number;
   private promises:{[index: number]:(value: number) => void};
   
   private worker: any;
   
   private onLoadPromise: any;
   
   private sample_base_url: string;
   
   constructor(sample_base_url: string="https://gleitz.github.io/midi-js-soundfonts/MusyngKite/")
   {
      /* Determine location of worker */   
      var worker_path = 'music-xml-player-worker.min.js';
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++)
      {
         var src = scripts[i].getAttribute('src');
         if (src.indexOf("?") >= 0)
         {
            src = src.substring(0, src.indexOf("?")-1);
         }
         
         if (src.endsWith('music-xml-player.js'))
         {
            worker_path = src.slice(0, src.lastIndexOf('/'))+'/music-xml-player-worker.js';
         }
         else if (src.endsWith('music-xml-player.min.js'))
         {
            worker_path = src.slice(0, src.lastIndexOf('/'))+'/music-xml-player-worker.min.js';
         }
      }

      /* Set internal data  */
      this.is_loaded = false;
      this.is_cleanup = false;
      this.instruments = [];
      this.note_parser = NoteParser();
      
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      
      this.playing = false;
      this.shall_feed = false;
      this.last_sent_finish_time = 0;
      this.periodic_function = setInterval(this.onCyclic.bind(this), 100);
      this.in_sending = false;

      this.feeded = false;
      this.duration = 0.5;
      
      this.sample_base_url = sample_base_url;

      /* Set queue of promises under wait */
      this.last_promise_id = 0;
      this.promises = {};
      
      /* Initialise workers */
      this.worker = new Worker(worker_path);
      this.onLoadPromise = new Promise(this.OnWorkerInitialised.bind(this));
   }
   
   cleanup(): void
   {
      if (!this.is_cleanup)
      {
         this.is_cleanup = true;
         clearInterval(this.periodic_function);
         this.worker.terminate();
         this.context.close()
      }
   }
   
   private OnWorkerInitialised(resolve: (value: boolean) => void)
   {
      this.worker.onmessage = this.ManageWorkerMessage.bind(this, resolve);
   }
   
   private ManageWorkerMessage(resolve: (value: boolean) => void, e: any)
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
   }
   
   waitReady(callback: Function): void
   {
      this.onLoadPromise.then(callback);
   }
   
   loadInstruments(instruments: number[], used_notes: {[index: number]:{[index: string]:boolean}}, callback: () => void): void
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      /* Check which instruments have not been loaded */
      var instruments_to_load: number[] = [];
      var instruments_url: string[] = []
      for (const i of instruments)
      {
         if ((!this.instruments.includes(i)) && (!instruments_to_load.includes(i)))
         {
            instruments_to_load.push(i);
            instruments_url.push(this.sample_base_url+this.midiInstrumentsNames[i]+"-mp3.js")
         }
      }
      
      /* Check if we have at least one instrument to load */
      if (instruments_to_load.length <= 0)
      {
         callback();
         return
      }
      
      /* Format urls */
      requirejs(instruments_url, this.OnLoadInstruments.bind(this, instruments_to_load, used_notes, callback));
   }
   
   private OnLoadInstruments(instruments_to_load: number[], used_notes: {[index: number]:{[index: string]:boolean}}, callback: () => void) 
   {
      var promises = [];
      
      window.MIDI = window.MIDI || {};
      window.MIDI.parsed = window.MIDI.parsed || {};
      
      /* Perform full conversion of inputs */
      for (let instrument of instruments_to_load)
      {
         var filtered_notes = [];
         var tmp = Object.keys(used_notes[instrument])
         for (const t of tmp)
         {
            filtered_notes.push(this.note_parser.convert(t));
         }

         this.instruments.push(instrument);
         window.MIDI.parsed[this.midiInstrumentsNames[instrument]] = window.MIDI.parsed[this.midiInstrumentsNames[instrument]] || {};
         
         for (let note in window.MIDI.Soundfont[this.midiInstrumentsNames[instrument]])
         {
            if (filtered_notes.includes(this.note_parser.convert(note)))
            {
               promises.push(this.OnLoadNote(window.MIDI.Soundfont[this.midiInstrumentsNames[instrument]][note], instrument, note))
            }
         }
      }

      /* Wait for all promises to resolve */
      Promise.all(promises).then(callback);
   }
   
   AddReplayedInstrument(instrument_id: number): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.AddReplayedInstrumentToWorker(instrument_id);
   }
   
   ClearAll(): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.ClearAllToWorker();
   }
   
   SetReplayedInstrumentVolume(replayed_instrument: number, volume: number): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.SetReplayedInstrumentVolumeToWorker(replayed_instrument, volume);
   }
   
   SetReplayedInstrumentInstrument(replayed_instrument: number, instrument: number): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.SetReplayedInstrumentInstrumentToWorker(replayed_instrument, instrument);
   }
   
   TriggerNote(replayed_instrument: number, note: string, offset: number, volume: number): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.TriggerNoteToWorker(replayed_instrument, this.note_parser.convert(note), Math.floor(offset*this.context.sampleRate), volume);
   }
   
   ReleaseNote(replayed_instrument: number, note: string, offset: number): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.ReleaseNoteToWorker(replayed_instrument, this.note_parser.convert(note), Math.floor(offset*this.context.sampleRate));
   }
   
   ReleaseAllNotes(replayed_instrument: number): Promise<number>
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.ReleaseAllNotes(replayed_instrument);
   }

   start(): void
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
   
   stop(): void
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      this.playing = false;
   }
   
   checkShallFeed(): boolean
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
   
   setFeededWithDuration(duration: number): number
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      this.duration = duration;
      this.feeded = true;
      return this.last_sent_finish_time;
   }
   
   now(): number
   {
      /* Check that we are initialised */
      if (!this.is_loaded) throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
         
      return this.context.currentTime;
   }

   private invokeWorkerCommand(name: string, args: any): Promise<number>
   {
      return new Promise<number>(this.InvokeWorkerCommandPromise.bind(this, name, args))
   }
   private InvokeWorkerCommandPromise(name: string, args: any, resolve: (value: number) => void): void
   {
      this.last_promise_id++;
      this.promises[this.last_promise_id] = resolve;
      this.worker.postMessage({'promise': this.last_promise_id,
                               'type': name,
                               'args': args});
   }
   
   private load_note(instrument_id: number, note: string, sample_rate: number, length: number, channel_1_data: Float32Array, channel_2_data: Float32Array) {return this.invokeWorkerCommand('load_note', [instrument_id, note, sample_rate, length, channel_1_data, channel_2_data])}

   private AddReplayedInstrumentToWorker(instrument_id: number) {return this.invokeWorkerCommand('AddReplayedInstrument', [instrument_id])}
   private ClearAllToWorker() {return this.invokeWorkerCommand('ClearAll', [])}

   private SetReplayedInstrumentVolumeToWorker(replayed_instrument: number, volume: number) {return this.invokeWorkerCommand('SetReplayedInstrumentVolume', [replayed_instrument, volume])}
   private SetReplayedInstrumentInstrumentToWorker(replayed_instrument: number, instrument: number) {return this.invokeWorkerCommand('SetReplayedInstrumentInstrument', [replayed_instrument, instrument])}

   private TriggerNoteToWorker(replayed_instrument: number, note: number, offset: number, volume: number) {return this.invokeWorkerCommand('TriggerNote', [replayed_instrument, note, offset, volume])}
   private ReleaseNoteToWorker(replayed_instrument: number, note: number, offset: number) {return this.invokeWorkerCommand('ReleaseNote', [replayed_instrument, note, offset])}

   private SampleDataToWorker(time: number) {return this.invokeWorkerCommand('SampleData', [time])}

   private midiInstrumentsNames : string[] =
      ["acoustic_grand_piano",
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
 
   private base64ToArrayBuffer(base64: string) 
   {
      var binary_string = window.atob(base64.slice(base64.lastIndexOf(',') + 1));
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++)
      {
         bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
   }
   
   private LoadNote(instrument: number, note: string, resolve: () => void, d: AudioBuffer)
   {
      var channel_1: Float32Array = d.getChannelData(0);
      var channel_2: Float32Array = d.getChannelData(1);
   
      this.internal_load_note(instrument, this.note_parser.convert(note), d.sampleRate, channel_1, channel_2).then(resolve)
   }
   private OnDecodeNote(b64_data: string,  instrument: number, note: string, resolve: () => void)
   {
      this.context.decodeAudioData(this.base64ToArrayBuffer(b64_data), this.LoadNote.bind(this, instrument, note, resolve));
   }
   private OnLoadNote(b64_data: string, instrument: number, note: string)
   {
      return new Promise(this.OnDecodeNote.bind(this, b64_data, instrument, note));
   }
   
   private internal_load_note(instrument_id: number, note: string, sample_rate: number, channel_1_data: Float32Array, channel_2_data: Float32Array)
   {
      return this.load_note(instrument_id, note, sample_rate, channel_1_data.length, channel_1_data, channel_2_data);
   }
   
   private SampleData(time: number)
   {
      /* Compute number of elements */
      var nb_samples = Math.floor(this.context.sampleRate*time);
      
      /* Perform the call */
      return this.SampleDataToWorker(nb_samples);
   }
   
   private SendDataToSoundCard(data: [Float32Array,Float32Array]): void
   {
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
   }
   
   private send_next_sample()
   {
      this.in_sending = true;
      
      /* Check if we have data */
      if (this.feeded)
      {
         /* Sample next duration */
         this.SampleData(this.duration).then(this.SendDataToSoundCard.bind(this))
      }
      else
      {
         this.SendDataToSoundCard([new Float32Array(this.duration*this.context.sampleRate),
                                   new Float32Array(this.duration*this.context.sampleRate)]);
      }
   }
   
   private onCyclic()
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
