import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { http, HttpResponse } from 'msw';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Default mock user for testing
export const mockUser = {
  uid: 'testUserId',
  displayName: 'Test User',
  photoURL: 'test-avatar.jpg',
  email: 'test@example.com'
};

// Mock Firebase Authentication
export const mockAuthState = {
  user: mockUser,
  loading: false,
  error: null
};

// Common Firebase mocks
export const mockFirebase = {
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: () => new Date().toISOString()
};

// Helper to render components with common providers
export function renderWithProviders(
  ui,
  {
    user = mockUser,
    authState = mockAuthState,
    route = '/',
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthContext.Provider value={{ ...authState, user }}>
          {children}
        </AuthContext.Provider>
      </BrowserRouter>
    );
  }
  
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Helper to create mock Firebase responses
export const createMockFirebaseData = (data) => {
  return {
    docs: data.map(doc => ({
      id: doc.id,
      data: () => doc,
      exists: () => true
    }))
  };
};

// Helper to wait for loading states
export const waitForLoadingToFinish = () =>
  waitFor(
    () => {
      const loaders = document.querySelectorAll('[aria-busy="true"]');
      if (loaders.length > 0) {
        throw new Error('Still loading');
      }
    },
    { timeout: 4000 }
  );