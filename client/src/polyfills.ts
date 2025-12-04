import { Buffer } from "buffer";

declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    process: { env: Record<string, string> };
  }
}

if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer;
  window.process = window.process || { env: {} };
}

export {};
