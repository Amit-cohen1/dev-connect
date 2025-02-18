import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/test-utils';
import ProjectDetail from '../ProjectDetail';
import ProjectComments from '../../components/ProjectComments';

jest.mock('../../firebase/config');

describe('Project Detail Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('comments integration with project details', async () => {
    renderWithProviders(
      <>
        <ProjectDetail projectId="test-project" />
        <ProjectComments projectId="test-project" organizationId="test-org" />
      </>
    );

    // Test comment creation and interaction with project details
    const commentInput = screen.getByPlaceholder(/ask a question/i);
    await userEvent.type(commentInput, 'Test integration comment');
    
    const submitButton = screen.getByText(/post comment/i);
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Verify comment appears in both components
      expect(screen.getByText('Test integration comment')).toBeInTheDocument();
    });
  });

  test('notifications are triggered when comments are added', async () => {
    const mockSendNotification = jest.fn();
    jest.mock('../../utils/notifications', () => ({
      sendNotification: mockSendNotification
    }));

    renderWithProviders(
      <ProjectComments projectId="test-project" organizationId="test-org" />
    );

    const commentInput = screen.getByPlaceholder(/ask a question/i);
    await userEvent.type(commentInput, '@TestUser check this out');
    
    const submitButton = screen.getByText(/post comment/i);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendNotification).toHaveBeenCalled();
    });
  });
});