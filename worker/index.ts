/* Define self keyword */
declare var self: DedicatedWorkerGlobalScope;

/* Set export stuff (we do not export, as in worker) */
export {};

/* Declare type of data exchanged with main thread */
const helloMessage = {
  hello: 'Hello world from my worker !!!!',
};
export type HelloMessage = typeof helloMessage;

/* Main part : we simply send data */
self.postMessage(helloMessage);
