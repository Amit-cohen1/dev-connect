// Load polyfills first
import './test-utils/polyfills';

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Configure global test environment
beforeAll(() => {
  // Start MSW Server
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  // Reset MSW handlers between tests
  server.resetHandlers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clean up any pending timers
  jest.useRealTimers();
});

afterAll(() => {
  // Clean up MSW server
  server.close();
});