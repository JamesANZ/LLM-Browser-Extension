// Test setup file
import "jest";

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    local: {
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
} as any;

// Mock DOM APIs
Object.defineProperty(window, "getSelection", {
  value: jest.fn(() => ({
    toString: jest.fn(() => "selected text"),
    anchorNode: {
      parentElement: document.createElement("div"),
    },
  })),
});

Object.defineProperty(document, "createElement", {
  value: jest.fn((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      style: {},
      innerHTML: "",
      textContent: "",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      remove: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        top: 0,
        left: 0,
        width: 100,
        height: 100,
      })),
    };
    return element;
  }),
});

Object.defineProperty(document, "querySelector", {
  value: jest.fn(),
});

Object.defineProperty(document, "querySelectorAll", {
  value: jest.fn(() => []),
});

Object.defineProperty(document.body, "appendChild", {
  value: jest.fn(),
});

Object.defineProperty(document.body, "removeChild", {
  value: jest.fn(),
});
