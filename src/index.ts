//import JSZip from "jszip";

export class Toto
{
   private mode: boolean
   private name;
   
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
         return 1;
      }
   }
}
