//import JSZip from "jszip";

export class Toto
{
   private mode: boolean
   private name: string;
   
   constructor(n: string, b: boolean)
   {
      this.name = n
      this.mode = b;
   }
   
   welcome(): string
   {
      if (this.mode)
      {
         return "Hello "+this.name+"!";
      }
      else
      {
         return "Bye"
      }
   }
}

/* Start the worker */
const worker = new Worker('/MusicXMLPlayer/dist/music-xml-player-worker.js');

/* Wait for reception of a message */
worker.onmessage = (event) =>
{
   /* Declare data with proper cast */
   const data = event.data as import('../worker').HelloMessage;

   /* Simply display it */
   console.log('Received in main thread : '+data.hello);
};
