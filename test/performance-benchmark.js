
// test/performance-benchmark.js

// Measure performance impact of premature rendering

const originalConsoleLog = console.log;
let domOpsCount = 0;

// Mock globals
global.HTMLElement = class HTMLElement {
  constructor() {
    this._attributes = {};
    // Start disconnected for this test
    this.isConnected = false;
  }
  getAttribute(name) {
    return this._attributes[name] || null;
  }
  setAttribute(name, value) {
    this._attributes[name] = value;
    // Simulate attributeChangedCallback if defined
    if (global.TrustabeeWidgetClass && global.TrustabeeWidgetClass.observedAttributes && global.TrustabeeWidgetClass.observedAttributes.includes(name)) {
        // Find the instance and call callback? No, 'this' refers to the instance here.
        // We need to assume the class prototype has the method.
        if (this.attributeChangedCallback) {
            this.attributeChangedCallback(name, null, value);
        }
    }
  }
};

global.customElements = {
  define: (name, constructor) => {
    global.TrustabeeWidgetClass = constructor;
  },
};

// Mock DOM operations and count them
global.document = {
  querySelector: () => {
    // console.error('Called querySelector'); // Debug
    domOpsCount++; return null;
  },
  createElement: () => {
    // console.error('Called createElement'); // Debug
    domOpsCount++; return { src: '', async: false };
  },
  head: {
    appendChild: () => {
      // console.error('Called appendChild'); // Debug
      domOpsCount++;
    },
    querySelector: () => {
      // console.error('Called head.querySelector'); // Debug
      domOpsCount++; return null;
    },
  },
};

// Mock console to suppress widget logs but keep errors visible if needed
global.console = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

// Load the widget script
require('../src/trustabee-widget.js');

function runBenchmark() {
  const iterations = 10000;
  domOpsCount = 0;

  if (!global.TrustabeeWidgetClass) {
      originalConsoleLog('TrustabeeWidgetClass not defined');
      return;
  }

  const widget = new global.TrustabeeWidgetClass();
  // Ensure we are disconnected
  Object.defineProperty(widget, 'isConnected', { value: false, writable: true });

  originalConsoleLog(`Starting benchmark with ${iterations} attribute changes (disconnected)...`);

  const startTime = process.hrtime();

  for (let i = 0; i < iterations; i++) {
    // Changing the attribute triggers attributeChangedCallback -> render()
    widget.setAttribute('location-id', `loc-${i}`);
  }

  const endTime = process.hrtime(startTime);
  const durationMs = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2);

  originalConsoleLog(`Benchmark completed in ${durationMs}ms`);
  originalConsoleLog(`Total DOM Operations performed: ${domOpsCount}`);
}

runBenchmark();
