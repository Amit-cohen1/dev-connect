import { mockUser, mockAuthState, renderWithProviders, waitForLoadingToFinish } from '../utils/test-utils';
import { server } from '../mocks/server';

// Common test utilities
export {
  mockUser,
  mockAuthState,
  renderWithProviders,
  waitForLoadingToFinish,
  server
};

// Common test data
export const mockData = {
  project: {
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test Description',
    technologies: ['React', 'Jest'],
    organizationId: 'test-org-id'
  },
  comment: {
    id: 'test-comment-id',
    text: 'Test comment',
    userId: mockUser.uid,
    userName: mockUser.displayName
  }
};

// Common test helpers
export const setupTestEnvironment = () => {
  beforeAll(() => {
    server.listen();
    jest.setTimeout(10000);
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });
};