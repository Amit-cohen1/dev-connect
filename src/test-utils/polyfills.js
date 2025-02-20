import { TextEncoder, TextDecoder } from 'util';
import { Blob } from 'buffer';
import { webcrypto } from 'node:crypto';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Blob = Blob;
global.crypto = webcrypto;

// Add TransformStream polyfill
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      return {
        readable: new ReadableStream(),
        writable: new WritableStream({
          write(chunk) {},
          close() {},
          abort(e) {}
        })
      };
    }
  };
}

// Add other necessary stream polyfills
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {};
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {};
}