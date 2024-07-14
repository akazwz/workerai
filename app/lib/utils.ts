import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function streamToArrayBuffer(readableStream: any) {
  const reader = readableStream.getReader();
  let chunks = []; // This will hold the chunks of data as Uint8Arrays
  let size = 0; // This will track the total length of the data

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    size += value.length;
  }

  // Combine the chunks into a single Uint8Array
  let combined = new Uint8Array(size);
  let offset = 0;
  for (let chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert the Uint8Array to an ArrayBuffer
  return combined.buffer;
}

export function arrayBufferToBase64(data: ArrayBuffer) {
  const bytes = new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function arrayBufferToBase64WithFileType(
  data: ArrayBuffer,
  fileType: string
) {
  return `data:${fileType};base64,${arrayBufferToBase64(data)}`;
}
