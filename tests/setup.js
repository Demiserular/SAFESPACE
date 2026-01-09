// Jest setup file
require('@testing-library/jest-dom');

// Mock window methods that may not exist in JSDOM
Object.defineProperty(global, 'window', {
  value: global.window || {},
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS if it doesn't exist
if (typeof CSS === 'undefined') {
  global.CSS = {
    supports: jest.fn().mockImplementation((property, value) => {
      if (property === 'contain' && value === 'layout size') {
        return true;
      }
      return false;
    })
  };
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Console helpers for manual testing
global.logNavbarInfo = () => {
  if (typeof window !== 'undefined' && window.NavbarTestUtils) {
    window.NavbarTestUtils.logNavbarPosition();
  }
};