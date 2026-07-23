// Force DNS to resolve IPv4 first (fixes fetch failed inside undici on Node 16)
try {
  const dns = require('dns');
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  console.warn("Could not set DNS resolution order", e);
}

// Polyfill URL.canParse for Metro server request parsing on Node 16
if (typeof URL.canParse === 'undefined') {
  URL.canParse = (url, base) => {
    try {
      new URL(url, base);
      return true;
    } catch (e) {
      return false;
    }
  };
}

// Polyfill ReadableStream for undici/fetch on Node 16
if (typeof global.ReadableStream === 'undefined') {
  try {
    const { ReadableStream } = require('web-streams-polyfill');
    global.ReadableStream = ReadableStream;
  } catch (e) {
    console.warn("Could not polyfill ReadableStream", e);
  }
}

// Polyfill os.availableParallelism for Metro Config on Node 16
const os = require('os');
if (typeof os.availableParallelism === 'undefined') {
  os.availableParallelism = () => {
    return os.cpus().length || 1;
  };
}

// Polyfill ES2023 Array methods for Metro / Expo CLI on Node 16
if (typeof Array.prototype.toReversed === 'undefined') {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

if (typeof Array.prototype.toSorted === 'undefined') {
  Array.prototype.toSorted = function(compareFn) {
    return [...this].sort(compareFn);
  };
}

if (typeof Array.prototype.toSpliced === 'undefined') {
  Array.prototype.toSpliced = function(start, deleteCount, ...items) {
    const copy = [...this];
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}
