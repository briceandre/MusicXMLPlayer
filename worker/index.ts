import SynthetiserModule from './SynthetiserModule.js';

/* Define self keyword */
declare var self: DedicatedWorkerGlobalScope;

/* Set export stuff (we do not export, as in worker) */
export {};

/* Declare type of data exchanged with main thread */
var postMessage = {
  type: '',
  promise: 1,
  result: {}
};
export type PostMessage = typeof postMessage;

function ConvertArrayBufferToWASMBufferPtr(d: ArrayBuffer, wasm_module: any)
{
   var data = new Float32Array(d);
   var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
   var dataPtr = wasm_module._malloc(nDataBytes);
   var dataHeap = new Uint8Array(wasm_module.HEAPU8.buffer, dataPtr, nDataBytes);
   dataHeap.set(new Uint8Array(data.buffer));
   return dataHeap.byteOffset;
}

function ConvertWASMBufferPtrToArrayBuffer(wasm_module: any, buffer: any, nb_samples: number)
{
   var data = new Float32Array(wasm_module.HEAP32.buffer, buffer, nb_samples);
   var result = new ArrayBuffer(nb_samples*4);
   var view = new Float32Array(result);
   for (var i = 0; i < nb_samples; i++)
   {
      view[i] = data[i]
   }
   return result;
}

function initialise(_wasm_module: any)
{
   /* Save var */
   var wasm_module: any = _wasm_module;
   
   /* Get pointers to functions */
   var wasm_functions: {[index: string]:any} =
   { 
      load_note: wasm_module.cwrap('LoadNote', 'number', ['number', 'number', 'number', 'number', 'number', 'number']),

      GetReplayedInstruments: wasm_module.cwrap('GetReplayedInstruments', 'number', ['number']),
      AddReplayedInstrument: wasm_module.cwrap('AddReplayInstrument', 'number', ['number']),
      ClearAll: wasm_module.cwrap('ClearAll', 'number', []),
   
      SetReplayedInstrumentVolume: wasm_module.cwrap('SetReplayedInstrumentVolume', 'number', ['number', 'number']),
      SetReplayedInstrumentInstrument: wasm_module.cwrap('SetReplayedInstrumentInstrument', 'number', ['number', 'number']),
   
      TriggerNote: wasm_module.cwrap('TriggerNote', 'number', ['number', 'number', 'number', 'number']),
      ReleaseNote: wasm_module.cwrap('ReleaseNote', 'number', ['number', 'number', 'number']),
      ReleaseAllNotes: wasm_module.cwrap('ReleaseAllNotes', 'number', ['number']),
   
      GetNotesTriggered: wasm_module.cwrap('GetNotesTriggered', 'number', ['number', 'number']),
   
      SampleData: wasm_module.cwrap('SampleData', 'number', ['number'])
   }
   
   /* Send message to notify of end of initialisation */
   self.postMessage({'type': 'initialised'});
   
   /* Set handlers on messages received */
   self.onmessage = function(e)
   {
      if (e.data.type == 'load_note')
      {
         var result = wasm_functions['load_note'](e.data.args[0],
                                                  e.data.args[1],
                                                  e.data.args[2],
                                                  e.data.args[3],
                                                  ConvertArrayBufferToWASMBufferPtr(e.data.args[4], wasm_module),
                                                  ConvertArrayBufferToWASMBufferPtr(e.data.args[5], wasm_module));
         self.postMessage({'type': 'load_note',
                           'promise': e.data.promise,
                           'result': result});
      }
      else if (e.data.type == 'SampleData')
      {
         /* Compute number of elements */
         var nb_samples = Math.floor(e.data.args[0]);
         
         /* Perform the call */
         var buffer = wasm_functions['SampleData'](nb_samples);
         
         /* Retrieve array */
         var buffer_1 = ConvertWASMBufferPtrToArrayBuffer(wasm_module, buffer, nb_samples);
         var buffer_2 = ConvertWASMBufferPtrToArrayBuffer(wasm_module, buffer+(4*nb_samples), nb_samples)
         
         /* Send data to main thread */
         self.postMessage({'type': 'SampleData',
                           'promise': e.data.promise,
                           'result': [buffer_1, buffer_2]},
                          [buffer_1, buffer_2]);
      }
      else if (wasm_functions.hasOwnProperty(e.data.type))
      {
         var result: any = wasm_functions[<string>e.data.type].apply(self, e.data.args);
         self.postMessage({'type': e.data.type,
                           'promise': e.data.promise,
                           'result': result});
      }
      else
      {
         console.log('SynthetiserModule Worker : unknown command '+e.data.type);
      }
   }
}

SynthetiserModule().then(function(wasm_module: any)
{
   initialise(wasm_module)
});
