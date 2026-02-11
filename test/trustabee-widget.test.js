// test/trustabee-widget.test.js

// Mock globals before requiring the script
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

global.customElements = {
  define: jest.fn((name, constructor) => {
    global.TrustabeeWidgetClass = constructor;
  }),
};

const querySelectorMock = jest.fn();

global.document = {
  querySelector: querySelectorMock,
  createElement: jest.fn(),
  head: {
    appendChild: jest.fn(),
    querySelector: querySelectorMock,
  },
};

global.console = {
  log: jest.fn(),
  warn: jest.fn(),
};

// Load the widget script
require('../src/trustabee-widget.js');

describe('TrustabeeWidget', () => {
  let widget;

  beforeEach(() => {
    jest.resetAllMocks();

    // Set up default mock implementations
    document.createElement.mockReturnValue({
      src: '',
      async: false,
    });

    // Create a new instance of the widget
    if (global.TrustabeeWidgetClass) {
        widget = new global.TrustabeeWidgetClass();
    } else {
        throw new Error('TrustabeeWidgetClass not captured from customElements.define');
    }
  });

  test('should inject script when location-id is set', () => {
    widget.setAttribute('location-id', 'test-123');
    document.querySelector.mockReturnValue(null);

    widget.render();

    const expectedUrl = 'https://staging-trustabee.elefity.com/api/widget.js?w=test-123';
    expect(document.querySelector).toHaveBeenCalledWith(`script[src="${expectedUrl}"]`);
    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(document.head.appendChild).toHaveBeenCalled();
  });

  test('should NOT inject script if already present (duplicate prevention)', () => {
    widget.setAttribute('location-id', 'test-123');
    const expectedUrl = 'https://staging-trustabee.elefity.com/api/widget.js?w=test-123';

    // Mock that the script already exists in DOM
    document.querySelector.mockImplementation((selector) => {
      if (selector === `script[src="${expectedUrl}"]`) {
        return { src: expectedUrl };
      }
      return null;
    });

    widget.render();

    expect(document.head.appendChild).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  test('should warn and return if location-id is missing', () => {
    widget.render();

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('location-id attribute is missing'));
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  test('should inject different scripts for different location-ids', () => {
    // First location
    widget.setAttribute('location-id', 'loc-1');
    document.querySelector.mockReturnValue(null);
    widget.render();

    const url1 = 'https://staging-trustabee.elefity.com/api/widget.js?w=loc-1';
    expect(document.querySelector).toHaveBeenCalledWith(`script[src="${url1}"]`);
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);

    // Second location
    const widget2 = new global.TrustabeeWidgetClass();
    widget2.setAttribute('location-id', 'loc-2');
    document.querySelector.mockReturnValue(null);
    widget2.render();

    const url2 = 'https://staging-trustabee.elefity.com/api/widget.js?w=loc-2';
    expect(document.querySelector).toHaveBeenCalledWith(`script[src="${url2}"]`);
    expect(document.head.appendChild).toHaveBeenCalledTimes(2);
  });

  test('attributeChangedCallback should trigger render when location-id changes', () => {
    const renderSpy = jest.spyOn(widget, 'render').mockImplementation(() => {});

    widget.attributeChangedCallback('location-id', 'old', 'new');

    expect(renderSpy).toHaveBeenCalled();
  });

  test('attributeChangedCallback should NOT trigger render if value is the same', () => {
    const renderSpy = jest.spyOn(widget, 'render').mockImplementation(() => {});

    widget.attributeChangedCallback('location-id', 'same', 'same');

    expect(renderSpy).not.toHaveBeenCalled();
  });

  test('should NOT render if not connected (optimization)', () => {
    // Simulate disconnected state
    widget.isConnected = false;

    // Set attribute to ensure it would try to render if checking proceeded
    widget.setAttribute('location-id', 'test-opt');

    widget.render();

    // Verify no DOM operations occurred
    expect(document.querySelector).not.toHaveBeenCalled();
    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });
});
