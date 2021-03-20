/* Define self keyword */
declare var self: DedicatedWorkerGlobalScope;

/* Set export stuff (we do not export, as in worker) */
export {};

/* Declare type of data exchanged with main thread */
var helloMessage = {
  hello: '',
};
export type HelloMessage = typeof helloMessage;

import TotoModule from './SynthetiserModule.js';

TotoModule().then(function(module: any)
{
   var toto = module.cwrap('toto', 'number', ['number', 'number']);

   helloMessage.hello = 'Hello world from my worker !!!! Result of 3x4='+toto(3,4);
   self.postMessage(helloMessage);
});

