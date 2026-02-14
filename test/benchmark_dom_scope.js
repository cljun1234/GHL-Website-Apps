// test/benchmark_dom_scope.js

// This benchmark simulates the performance difference between searching the entire document vs searching only the head.
// It mocks a large DOM (slow search) and a small HEAD (fast search).

const ITERATIONS = 10000;
const DOM_NODES_COUNT = 5000; // Simulate 5000 nodes in body
const HEAD_NODES_COUNT = 20;  // Simulate 20 nodes in head

// Mock HTMLElement
global.HTMLElement = class HTMLElement {
  constructor() {
    this._attributes = {};
    this.isConnected = true;
  }
  getAttribute(name) {
    return this._attributes[name] || null;
  }
  setAttribute(name, value) {
    this._attributes[name] = value;
  }
};

// Mock customElements
global.customElements = {
  define: (name, constructor) => {
    global.TrustabeeWidgetClass = constructor;
  },
};

// Mock console to reduce noise
global.console = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

// Mock document with performance characteristics
global.document = {
  // Simulating a full document search - slow
  querySelector: (selector) => {
    // Simulate iterating through many nodes
    for (let i = 0; i < DOM_NODES_COUNT; i++) {
      // Simulate check cost
      if (selector === 'non-existent-selector-to-force-full-scan') {
        return {};
      }
    }
    // Return null (not found) or mock object if found
    // For the purpose of this test, we assume the script is NOT found initially to force the check
    return null;
  },
  createElement: () => ({ src: '', async: false }),
  head: {
    appendChild: () => {},
    // Simulating a head-only search - fast
    querySelector: (selector) => {
      // Simulate iterating through few nodes
      for (let i = 0; i < HEAD_NODES_COUNT; i++) {
        if (selector === 'non-existent-selector-to-force-full-scan') {
          return {};
        }
      }
      return null;
    },
  },
};

// Load the widget script
require('../src/trustabee-widget.js');

function runBenchmark() {
  if (!global.TrustabeeWidgetClass) {
    process.stdout.write('TrustabeeWidgetClass not defined\n');
    return;
  }

  const widget = new global.TrustabeeWidgetClass();
  widget.setAttribute('location-id', 'bench-123');

  process.stdout.write(`Starting benchmark with ${ITERATIONS} iterations...\n`);
  process.stdout.write(`Simulated DOM Size: ${DOM_NODES_COUNT} nodes\n`);
  process.stdout.write(`Simulated HEAD Size: ${HEAD_NODES_COUNT} nodes\n`);

  const startTime = process.hrtime();

  for (let i = 0; i < ITERATIONS; i++) {
    // Call render directly or via attribute change simulation
    widget.render();
  }

  const endTime = process.hrtime(startTime);
  const durationMs = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2);

  process.stdout.write(`Benchmark completed in ${durationMs}ms\n`);
}

runBenchmark();
