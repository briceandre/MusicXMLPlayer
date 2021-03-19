import JSZip from "jszip";

const msg: string = "Hello World!";
const zip: JSZip = new JSZip();
const zipLoadedAsync: Promise<JSZip> = zip.loadAsync(msg);

console.log(zipLoadedAsync);