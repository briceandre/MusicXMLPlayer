(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/MusicXMLPlayer.ts":
/*!*******************************!*\
  !*** ./src/MusicXMLPlayer.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MusicXMLPlayer = void 0;
const Synthetizer_ts_1 = __webpack_require__(/*! ./Synthetizer.ts */ "./src/Synthetizer.ts");
class MusicXMLPlayer {
    constructor(mxl, sample_base_url = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/") {
        this.synth = new Synthetizer_ts_1.Synthetizer(sample_base_url);
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
        this.on_play_measure = function (a) { };
        this.on_stop = function () { };
        this.onLoadPromise = new Promise(this.OnLoadPromiseInitialised.bind(this, mxl));
    }
    OnLoadPromiseInitialised(mxl, resolve) {
        this.onLoadPromiseResolve = resolve;
        this.synth.waitReady(this.loadNotes.bind(this, mxl));
    }
    cleanup() {
        if (!this.is_cleaned_up) {
            this.is_cleaned_up = true;
            clearInterval(this.on_cyclic_callback);
            this.is_loaded = false;
            this.is_playing = false;
            this.playing_info = [];
            this.next_measure_to_send = 0;
            this.on_play_measure = function (a) { };
            this.on_stop = function () { };
            this.synth.cleanup();
        }
    }
    waitReady() {
        return this.onLoadPromise;
    }
    static getAvailableInstruments() {
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
            "Gunshot"];
    }
    setReplayInstrument(voice_id, instrument_id) {
        var notes_to_load = this.getNotes();
        var notes_of_instrument = {};
        notes_of_instrument[instrument_id] = notes_to_load[parseInt(this.data['score-partwise'][0]['part-list']['score-part'][voice_id]['midi-instrument']['midi-program']) - 1];
        this.synth.loadInstruments([instrument_id], notes_of_instrument, function () {
            this.synth.SetReplayedInstrumentInstrument(this.selected_replayed_instruments[voice_id], instrument_id);
        }.bind(this));
    }
    setReplayVolume(voice_id, volume) {
        this.synth.SetReplayedInstrumentVolume(this.selected_replayed_instruments[voice_id], volume);
    }
    loadInstruments(instruments, callback) {
        /* Extract notes needed */
        this.synth.loadInstruments(instruments, this.getNotes(), callback);
    }
    getInstruments() {
        var instruments = [];
        for (const i of this.data['score-partwise'][0]['part-list']['score-part']) {
            instruments.push({ name: i['part-name'], instrument_id: parseInt(i['midi-instrument']['midi-program']) - 1 });
        }
        return instruments;
    }
    OnNotesLoaded(data) {
        this.data = data;
        this.selected_instruments = [];
        this.selected_replayed_instruments = [];
        var tmp = this.getInstruments();
        for (var i = 0; i < tmp.length; i++) {
            this.selected_instruments.push(tmp[i].instrument_id);
        }
        /* Ensure we have instruments */
        this.synth.ClearAll();
        this.loadInstruments(this.selected_instruments, this.OnInstrumentsLoded.bind(this, tmp));
    }
    OnInstrumentsLoded(instruments) {
        /* Push replayed instruments */
        this.selected_replayed_instruments = [];
        for (var i = 0; i < instruments.length; i++) {
            this.synth.AddReplayedInstrument(instruments[i].instrument_id).then(function (r) { this.selected_replayed_instruments.push(r); }.bind(this));
        }
        /* Notify end of load */
        this.onLoadPromiseResolve();
    }
    setTempo(t) {
        this.tempo = t;
    }
    resetPlayingInfo() {
        this.playing_info = [];
        for (var i = 0; i < this.selected_instruments.length; i++) {
            this.playing_info.push({ 'measures_attributes': { 'division': 1, 'beats': 1, 'beat_type': 1 },
                'playing_notes': {} });
        }
    }
    start(on_play_measure, on_stop) {
        /* Start this.synth to be sure we take the audiocontext */
        this.synth.start();
        /* launch the engine */
        this.on_play_measure = on_play_measure;
        this.on_stop = on_stop;
        if (!this.is_loaded) {
            /* Reset playing info */
            this.resetPlayingInfo();
            /* Reset internal state */
            this.is_playing = true;
            this.is_loaded = true;
        }
        else {
            this.is_playing = true;
        }
    }
    moveToMeasure(measure_id) {
        this.next_measure_to_send = measure_id - 1;
    }
    pause() {
        this.synth.stop();
        this.is_playing = false;
    }
    stop() {
        this.synth.stop();
        this.is_playing = false;
        this.resetPlayingInfo();
        this.next_measure_to_send = 0;
    }
    ComputeNoteSymbol(pitch) {
        var note_symbol = pitch.step;
        if (pitch.alter && (pitch.alter == '-1')) {
            note_symbol += 'b';
        }
        else if (pitch.alter && (pitch.alter == '-2')) {
            note_symbol += 'bb';
        }
        else if (pitch.alter && (pitch.alter == '1')) {
            note_symbol += '#';
        }
        else if (pitch.alter && (pitch.alter == '2')) {
            note_symbol += 'x';
        }
        note_symbol += pitch.octave;
        return note_symbol;
    }
    PlayVoice(voice, instrument, note_data, instrument_id, measure_id) {
        let measure = note_data[instrument_id].measure[measure_id];
        var current_note_start = 0;
        var last_note_duration = 0;
        /*
         * Check all notes that we shall stop at begin of measure
         * Note that notes that must be released in the middle of the measure will be managed after.
         * Note also that this code is defensive : should never occur...
         */
        var notes_to_stop = [];
        if (voice in this.playing_info[instrument_id].playing_notes) {
            notes_to_stop = this.playing_info[instrument_id].playing_notes[voice];
        }
        var remaining_notes_to_stop = [];
        for (const note_to_stop of notes_to_stop) {
            /* Check if we can find it */
            var shall_keep = false;
            for (let entry of measure.entry) {
                if ((voice == entry.voice) &&
                    (entry.type == 'note') &&
                    (entry.pitch) &&
                    (this.ComputeNoteSymbol(entry.pitch) == note_to_stop)) {
                    /* Check if we shall keep it start */
                    if (entry.tie) {
                        shall_keep = true;
                    }
                }
            }
            /* Check if we keep it on */
            if (shall_keep) {
                /* Push it in remaining notes */
                remaining_notes_to_stop.push(note_to_stop);
            }
            else {
                /* Stop it */
                this.synth.ReleaseNote(instrument, note_to_stop, 0);
            }
        }
        this.playing_info[instrument_id].playing_notes[voice] = remaining_notes_to_stop;
        /* plan all notes */
        for (let entry of measure.entry) {
            if (voice == entry.voice) {
                /* Check for duration */
                var current_note_duration = 0;
                if (entry.duration) {
                    current_note_duration = (this.playing_info[instrument_id].measures_attributes.beat_type / 4) * ((60 / this.tempo) / this.playing_info[instrument_id].measures_attributes.division) * entry.duration;
                }
                if (entry.type == 'forward') {
                    current_note_start += last_note_duration;
                    last_note_duration = current_note_duration;
                }
                else if (entry.type == 'note') {
                    if (!current_note_duration) {
                        //TODO : ornament note -> currently, we skip them
                    }
                    else {
                        var shall_start = true;
                        var shall_stop = true;
                        var note_symbol = '_';
                        if (entry.pitch) {
                            note_symbol = this.ComputeNoteSymbol(entry.pitch);
                        }
                        if (!entry.chord) {
                            current_note_start += last_note_duration;
                            last_note_duration = current_note_duration;
                        }
                        if (entry.tie) {
                            var is_start = false;
                            for (const tie of entry.tie) {
                                if (tie.type == 'start') {
                                    is_start = true;
                                }
                            }
                            /*
                             * Check if we must start it.
                             * Note that, even if this is a stop, if note was not triggered, we start it if not played
                             * and we will switch it off at the end of the note
                             */
                            if (this.playing_info[instrument_id].playing_notes[voice].includes(note_symbol)) {
                                shall_start = false;
                            }
                            /* Check if we must stop if */
                            if (is_start) {
                                shall_stop = false;
                                if (!this.playing_info[instrument_id].playing_notes[voice].includes(note_symbol)) {
                                    this.playing_info[instrument_id].playing_notes[voice].push(note_symbol);
                                }
                            }
                            else {
                                if (this.playing_info[instrument_id].playing_notes[voice].includes(note_symbol)) {
                                    this.playing_info[instrument_id].playing_notes[voice].splice(this.playing_info[instrument_id].playing_notes[voice].indexOf(note_symbol), 1);
                                }
                            }
                        }
                        if (entry.pitch) {
                            if (shall_start && shall_stop) {
                                this.synth.TriggerNote(instrument, note_symbol, current_note_start, 1.0);
                                this.synth.ReleaseNote(instrument, note_symbol, current_note_start + current_note_duration);
                            }
                            else if (shall_start) {
                                this.synth.TriggerNote(instrument, note_symbol, current_note_start, 1.0);
                            }
                            else if (shall_stop) {
                                this.synth.ReleaseNote(instrument, note_symbol, current_note_start + current_note_duration);
                            }
                        }
                    }
                }
            }
        }
        return current_note_start + current_note_duration;
    }
    PlayInstrument(instrument, note_data, instrument_id, measure_id) {
        let measure = note_data[instrument_id].measure[measure_id];
        /* Upate attributes */
        if (measure.attributes) {
            for (const attribute of measure.attributes) {
                if (attribute.divisions) {
                    this.playing_info[instrument_id].measures_attributes.division = attribute.divisions;
                }
                ;
                if (attribute.time) {
                    if (attribute.time['beat-type'])
                        this.playing_info[instrument_id].measures_attributes.beat_type = attribute.time['beat-type'];
                    if (attribute.time['beats'])
                        this.playing_info[instrument_id].measures_attributes.beats = attribute.time['beats'];
                }
            }
        }
        /* Get all voices */
        var voices = [];
        for (let entry of measure.entry) {
            if (!voices.includes(entry.voice))
                voices.push(entry.voice);
        }
        /* Play the voices */
        var measure_duration = 0;
        for (let voice of voices) {
            var duration = this.PlayVoice(voice, instrument, note_data, instrument_id, measure_id);
            if (measure_duration) {
                if (duration > measure_duration)
                    measure_duration = duration;
            }
            else {
                measure_duration = duration;
            }
        }
        return measure_duration;
    }
    TriggerOnMeasure(measure_id) {
        this.on_play_measure(measure_id);
    }
    PlayMeasure() {
        /* play the instruments */
        var measure_duration = 0;
        for (var id = 0; id < this.selected_instruments.length; id++) {
            var d = this.PlayInstrument(this.selected_replayed_instruments[id], this.data['score-partwise'][0].part, id, this.next_measure_to_send);
            if (measure_duration) {
                if (measure_duration < d)
                    measure_duration = d;
            }
            else {
                measure_duration = d;
            }
        }
        /* Confirm the sending of the measure */
        var measure_start_time = this.synth.setFeededWithDuration(measure_duration);
        /* Send callback */
        var measure_played = this.next_measure_to_send + 1;
        setTimeout(this.TriggerOnMeasure.bind(this, measure_played), (measure_start_time - this.synth.now()) * 1000);
        /* Check if we still have something to play */
        if ((this.next_measure_to_send < (this.data['score-partwise'][0].part[0].measure.length - 1))) {
            /* Update internal data */
            this.next_measure_to_send++;
        }
        else {
            /* stop the play */
            this.is_playing = false;
            this.resetPlayingInfo();
            this.next_measure_to_send = 0;
            /* Send the callback */
            setTimeout(this.on_stop, (measure_start_time + measure_duration - this.synth.now()) * 1000);
        }
    }
    getNotes() {
        var notes = {};
        var instrument = 0;
        for (let part of this.data['score-partwise'][0].part) {
            for (let measure of part.measure) {
                for (let entry of measure.entry) {
                    if ((entry.type == 'note') &&
                        (entry.pitch)) {
                        var note = this.ComputeNoteSymbol(entry.pitch);
                        var i = this.selected_instruments[instrument];
                        notes[i] = notes[i] || {};
                        notes[i][note] = true;
                    }
                }
            }
            instrument++;
        }
        return notes;
    }
    OnCyclic() {
        if (this.is_playing &&
            this.synth.checkShallFeed()) {
            this.PlayMeasure();
        }
    }
    loadNotes(mxl) {
        /* Extract XML */
        this.extractXML(mxl);
    }
    OnXMLExtracted(xml) {
        var attributes_filter = { 'part': { 'id': 'id' },
            'tie': { 'type': 'type' } };
        var array_nodes = ['score-partwise', 'score-part', 'part', 'measure', 'note', 'attributes', 'forward', 'tie'];
        var children_filter = { 'root': { 'score-partwise': {} },
            'score-partwise': { 'part-list': {}, 'part': {} },
            'part-list': { 'score-part': {} },
            'score-part': { 'part-name': {}, 'midi-instrument': {} },
            'part-name': { '@text': {} },
            'midi-instrument': { 'midi-program': {} },
            'midi-program': { '@text': {} },
            'part': { 'measure': {} },
            'measure': { 'attributes': {}, 'note': { 'export_name': 'entry', 'attributes': [{ 'name': 'type', 'value': 'note' }] }, 'forward': { 'export_name': 'entry', 'attributes': [{ 'name': 'type', 'value': 'forward' }] } },
            'attributes': { 'divisions': {}, 'time': {}, 'transpose': {} },
            'divisions': { '@text': {} },
            'time': { 'beats': {}, 'beat-type': {} },
            'beats': { '@text': {} },
            'beat_type': { '@text': {} },
            'transpose': { 'diatonic': {}, 'chromatic': {}, 'octave-change': {} },
            'diatonic': { '@text': {} },
            'chromatic': { '@text': {} },
            'octave-change': { '@text': {} },
            'note': { 'rest': {}, 'pitch': {}, 'duration': {}, 'tie': {}, 'chord': {}, 'voice': {} },
            'rest': {},
            'pitch': { 'step': {}, 'octave': {}, 'alter': {} },
            'step': { '@text': {} },
            'octave': { '@text': {} },
            'duration': { '@text': {} },
            'tie': {},
            'forward': { 'duration': {}, 'voice': {} } };
        function xmlToJson(xml, node_parent) {
            // Create the return object
            var obj = {};
            if (xml.nodeType == 1) {
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    if (attributes_filter[node_parent] && attributes_filter[node_parent][attribute.nodeName]) {
                        obj[attributes_filter[node_parent][attribute.nodeName]] = attribute.nodeValue;
                    }
                }
            }
            else if (xml.nodeType == 3) {
                return false;
            }
            var textNodes = [].slice.call(xml.childNodes).filter(function (node) {
                return node.nodeType === 3;
            });
            if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
                obj = [].slice.call(xml.childNodes).reduce(function (text, node) {
                    return text + node.nodeValue;
                }, "");
            }
            else if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.children.length; i++) {
                    var item = xml.children.item(i);
                    var nodeName = item.nodeName;
                    if (children_filter[node_parent] && (nodeName in children_filter[node_parent])) {
                        var export_name = nodeName;
                        if (children_filter[node_parent][nodeName]['export_name']) {
                            export_name = children_filter[node_parent][nodeName]['export_name'];
                        }
                        var value = xmlToJson(item, nodeName);
                        if (children_filter[node_parent][nodeName]['attributes']) {
                            for (const a of children_filter[node_parent][nodeName]['attributes']) {
                                value[a.name] = a.value;
                            }
                        }
                        if (typeof obj[export_name] == "undefined") {
                            if (array_nodes.includes(nodeName)) {
                                obj[export_name] = [value];
                            }
                            else {
                                obj[export_name] = value;
                            }
                        }
                        else {
                            if (typeof obj[export_name].push == "undefined") {
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
    OnXMLManifestLoaded(zip, data) {
        /* Retrieve main file */
        var main_file = (new DOMParser()).parseFromString(data, "text/xml").getElementsByTagName('rootfile')[0].getAttribute('full-path');
        /* Extract it */
        zip.file(main_file).async("string").then(this.OnXMLExtracted.bind(this));
    }
    OnXMLLoaded(zip) {
        zip.file("META-INF/container.xml").async("string").then(this.OnXMLManifestLoaded.bind(this, zip));
    }
    extractXML(mxl) {
        /* Unzip */
        var z = new JSZip();
        z.loadAsync(mxl).then(this.OnXMLLoaded.bind(this));
    }
}
exports.MusicXMLPlayer = MusicXMLPlayer;


/***/ }),

/***/ "./src/Synthetizer.ts":
/*!****************************!*\
  !*** ./src/Synthetizer.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Synthetizer = void 0;
class Synthetizer {
    constructor(sample_base_url = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/") {
        this.midiInstrumentsNames = ["acoustic_grand_piano",
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
            "gunshot"];
        /* Determine location of worker */
        var worker_path = 'music-xml-player-worker.min.js';
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            if (src) {
                if (src.indexOf("?") >= 0) {
                    src = src.substring(0, src.indexOf("?"));
                }
                if (src.endsWith('music-xml-player.js')) {
                    worker_path = src.slice(0, src.lastIndexOf('/')) + '/music-xml-player-worker.js';
                }
                else if (src.endsWith('music-xml-player.min.js')) {
                    worker_path = src.slice(0, src.lastIndexOf('/')) + '/music-xml-player-worker.min.js';
                }
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
        this.loaded_notes = {};
        /* Set queue of promises under wait */
        this.last_promise_id = 0;
        this.promises = {};
        /* Initialise workers */
        this.worker = new Worker(worker_path);
        this.onLoadPromise = new Promise(this.OnWorkerInitialised.bind(this));
    }
    cleanup() {
        if (!this.is_cleanup) {
            this.is_cleanup = true;
            clearInterval(this.periodic_function);
            this.worker.terminate();
            this.context.close();
        }
    }
    OnWorkerInitialised(resolve) {
        this.worker.onmessage = this.ManageWorkerMessage.bind(this, resolve);
    }
    ManageWorkerMessage(resolve, e) {
        if (e.data.type == 'initialised') {
            this.is_loaded = true;
            resolve(true);
        }
        else if (this.promises.hasOwnProperty(e.data.promise)) {
            this.promises[e.data.promise](e.data.result);
            delete this.promises[e.data.promise];
        }
    }
    waitReady(callback) {
        this.onLoadPromise.then(callback);
    }
    loadInstruments(instruments, used_notes, callback) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        /* Check which instruments have not been loaded */
        var instruments_to_load = [];
        var instruments_url = [];
        for (const i of instruments) {
            if ((!this.instruments.includes(i)) && (!instruments_to_load.includes(i))) {
                instruments_to_load.push(i);
                instruments_url.push(this.sample_base_url + this.midiInstrumentsNames[i] + "-mp3.js");
            }
        }
        /* Check if we have at least one instrument to load */
        if (instruments_to_load.length <= 0) {
            callback();
            return;
        }
        /* Format urls */
        requirejs(instruments_url, this.OnLoadInstruments.bind(this, instruments_to_load, used_notes, callback));
    }
    AppendNote(instrument, note) {
        if (!this.loaded_notes.hasOwnProperty(instrument)) {
            this.loaded_notes[instrument] = [];
        }
        if (this.loaded_notes[instrument].includes(note)) {
            return false;
        }
        else {
            this.loaded_notes[instrument].push(note);
            return true;
        }
    }
    OnLoadInstruments(instruments_to_load, used_notes, callback) {
        var promises = [];
        window.MIDI = window.MIDI || {};
        window.MIDI.parsed = window.MIDI.parsed || {};
        /* Perform full conversion of inputs */
        for (let instrument of instruments_to_load) {
            var filtered_notes = [];
            var tmp = Object.keys(used_notes[instrument]);
            for (const t of tmp) {
                filtered_notes.push(this.note_parser.convert(t));
            }
            this.instruments.push(instrument);
            window.MIDI.parsed[this.midiInstrumentsNames[instrument]] = window.MIDI.parsed[this.midiInstrumentsNames[instrument]] || {};
            for (let note in window.MIDI.Soundfont[this.midiInstrumentsNames[instrument]]) {
                if (filtered_notes.includes(this.note_parser.convert(note))) {
                    if (this.AppendNote(instrument, note)) {
                        promises.push(this.OnLoadNote(window.MIDI.Soundfont[this.midiInstrumentsNames[instrument]][note], instrument, note));
                    }
                }
            }
        }
        /* Wait for all promises to resolve */
        Promise.all(promises).then(callback);
    }
    AddReplayedInstrument(instrument_id) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.AddReplayedInstrumentToWorker(instrument_id);
    }
    ClearAll() {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.ClearAllToWorker();
    }
    SetReplayedInstrumentVolume(replayed_instrument, volume) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.SetReplayedInstrumentVolumeToWorker(replayed_instrument, volume);
    }
    SetReplayedInstrumentInstrument(replayed_instrument, instrument) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.SetReplayedInstrumentInstrumentToWorker(replayed_instrument, instrument);
    }
    TriggerNote(replayed_instrument, note, offset, volume) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.TriggerNoteToWorker(replayed_instrument, this.note_parser.convert(note), Math.floor(offset * this.context.sampleRate), volume);
    }
    ReleaseNote(replayed_instrument, note, offset) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.ReleaseNoteToWorker(replayed_instrument, this.note_parser.convert(note), Math.floor(offset * this.context.sampleRate));
    }
    ReleaseAllNotes(replayed_instrument) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.ReleaseAllNotes(replayed_instrument);
    }
    start() {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        this.playing = true;
        this.shall_feed = true;
        this.feeded = false;
        this.duration = 0.5;
        this.last_sent_finish_time = this.context.currentTime;
        this.send_next_sample();
    }
    stop() {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        this.playing = false;
    }
    checkShallFeed() {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        if (this.shall_feed) {
            this.shall_feed = false;
            return true;
        }
        return false;
    }
    setFeededWithDuration(duration) {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        this.duration = duration;
        this.feeded = true;
        return this.last_sent_finish_time;
    }
    now() {
        /* Check that we are initialised */
        if (!this.is_loaded)
            throw new Error('Synthetiser not initialised. Please call waitReady prior to any other call !');
        return this.context.currentTime;
    }
    invokeWorkerCommand(name, args) {
        return new Promise(this.InvokeWorkerCommandPromise.bind(this, name, args));
    }
    InvokeWorkerCommandPromise(name, args, resolve) {
        this.last_promise_id++;
        this.promises[this.last_promise_id] = resolve;
        this.worker.postMessage({ 'promise': this.last_promise_id,
            'type': name,
            'args': args });
    }
    load_note(instrument_id, note, sample_rate, length, channel_1_data, channel_2_data) {
        return new Promise(this.load_note_Promise.bind(this, instrument_id, note, sample_rate, length, channel_1_data, channel_2_data));
    }
    load_note_Promise(instrument_id, note, sample_rate, length, channel_1_data, channel_2_data, resolve) {
        this.last_promise_id++;
        this.promises[this.last_promise_id] = resolve;
        this.worker.postMessage({ 'promise': this.last_promise_id,
            'type': 'load_note',
            'args': [instrument_id, note, sample_rate, length, channel_1_data, channel_2_data] }, [channel_1_data, channel_2_data]);
    }
    AddReplayedInstrumentToWorker(instrument_id) { return this.invokeWorkerCommand('AddReplayedInstrument', [instrument_id]); }
    ClearAllToWorker() { return this.invokeWorkerCommand('ClearAll', []); }
    SetReplayedInstrumentVolumeToWorker(replayed_instrument, volume) { return this.invokeWorkerCommand('SetReplayedInstrumentVolume', [replayed_instrument, volume]); }
    SetReplayedInstrumentInstrumentToWorker(replayed_instrument, instrument) { return this.invokeWorkerCommand('SetReplayedInstrumentInstrument', [replayed_instrument, instrument]); }
    TriggerNoteToWorker(replayed_instrument, note, offset, volume) { return this.invokeWorkerCommand('TriggerNote', [replayed_instrument, note, offset, volume]); }
    ReleaseNoteToWorker(replayed_instrument, note, offset) { return this.invokeWorkerCommand('ReleaseNote', [replayed_instrument, note, offset]); }
    SampleDataToWorker(time) { return this.invokeWorkerCommand('SampleData', [time]); }
    base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64.slice(base64.lastIndexOf(',') + 1));
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
    LoadNote(instrument, note, resolve, d) {
        /* Extract data */
        var channel_1 = d.getChannelData(0);
        var channel_2 = d.getChannelData(1);
        /* Convert to ArrayBuffer */
        var channel_1_buffer = new ArrayBuffer(4 * channel_1.length);
        var channel_2_buffer = new ArrayBuffer(4 * channel_2.length);
        var channel_1_buffer_view = new Float32Array(channel_1_buffer);
        var channel_2_buffer_view = new Float32Array(channel_2_buffer);
        for (var i = 0; i < channel_1.length; i++) {
            channel_1_buffer_view[i] = channel_1[i];
            channel_2_buffer_view[i] = channel_2[i];
        }
        this.internal_load_note(instrument, this.note_parser.convert(note), d.sampleRate, channel_1.length, channel_1_buffer, channel_2_buffer).then(resolve);
    }
    OnDecodeNote(b64_data, instrument, note, resolve) {
        this.context.decodeAudioData(this.base64ToArrayBuffer(b64_data), this.LoadNote.bind(this, instrument, note, resolve));
    }
    OnLoadNote(b64_data, instrument, note) {
        return new Promise(this.OnDecodeNote.bind(this, b64_data, instrument, note));
    }
    internal_load_note(instrument_id, note, sample_rate, nb_samples, channel_1_data, channel_2_data) {
        return this.load_note(instrument_id, note, sample_rate, nb_samples, channel_1_data, channel_2_data);
    }
    SampleData(time) {
        /* Compute number of elements */
        var nb_samples = Math.floor(this.context.sampleRate * time);
        /* Perform the call */
        return this.SampleDataToWorker(nb_samples);
    }
    SendDataToSoundCard(data) {
        /* Convert data from ArrayBuffer to Float32Array */
        var data_buffer_1 = new Float32Array(data[0]);
        var data_buffer_2 = new Float32Array(data[1]);
        /* Create the audio buffer */
        var buffer = this.context.createBuffer(2, this.duration * this.context.sampleRate, this.context.sampleRate);
        this.shall_feed = true;
        /* feed in buffer */
        var b1 = buffer.getChannelData(0);
        var b2 = buffer.getChannelData(1);
        for (var i = 0; i < buffer.length; i++) {
            b1[i] = data_buffer_1[i];
            b2[i] = data_buffer_2[i];
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
    send_next_sample() {
        this.in_sending = true;
        /* Check if we have data */
        if (this.feeded) {
            /* Sample next duration */
            this.SampleData(this.duration).then(this.SendDataToSoundCard.bind(this));
        }
        else {
            this.SendDataToSoundCard([new Float32Array(this.duration * this.context.sampleRate),
                new Float32Array(this.duration * this.context.sampleRate)]);
        }
    }
    onCyclic() {
        /* Run only of we are playing */
        if (!this.playing)
            return;
        /* Check that we are not in sending stuff */
        if (this.in_sending)
            return;
        /* We send next sample only half second before expiration */
        if ((this.last_sent_finish_time - 1.0) <= this.context.currentTime) {
            this.send_next_sample();
        }
    }
}
exports.Synthetizer = Synthetizer;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__("./src/Synthetizer.ts");
/******/ 	var __webpack_exports__ = __webpack_require__("./src/MusicXMLPlayer.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=music-xml-player.js.map