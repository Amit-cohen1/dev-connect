import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser } from '../../utils/test-utils';
import ProjectComments from '../ProjectComments';

// Mock Firebase notifications
jest.mock('../../utils/notifications', () => ({
  sendNotification: jest.fn()
}));

describe('ProjectComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders comment input form', () => {
    renderWithProviders(
      <ProjectComments projectId="test-project" organizationId="test-org" />
    );
    
    expect(screen.getByPlaceholder(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
  });

  it('allows users to submit comments', async () => {
    renderWithProviders(
      <ProjectComments projectId="test-project" organizationId="test-org" />
    );
    
    const commentInput = screen.getByPlaceholder(/ask a question/i);
    await userEvent.type(commentInput, 'Test comment');
    
    const submitButton = screen.getByRole('button', { name: /post comment/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(commentInput).toHaveValue('');
    });
  });

  it('displays existing comments', async () => {
    renderWithProviders(
      <ProjectComments projectId="test-project" organizationId="test-org" />
    );

    await waitFor(() => {
      expect(screen.getByText('Test comment')).toBeInTheDocument();
    });
  });

  it('handles user mentions', async () => {
    renderWithProviders(
      <ProjectComments projectId="test-project" organizationId="test-org" />
    );
    
    const commentInput = screen.getByPlaceholder(/ask a question/i);
    await userEvent.type(commentInput, '@Test');
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('allows replying to comments', async () => {
    renderWithProviders(
      <ProjectComments projectId="test-project" organizationId="test-org" />
    );

    await waitFor(() => {
      const replyButton = screen.getByRole('button', { name: /reply/i });
      userEvent.click(replyButton);
    });

    const replyInput = await screen.findByPlaceholder(/reply to test user/i);
    await userEvent.type(replyInput, 'Test reply');
    
    const submitReplyButton = screen.getByRole('button', { name: /^reply$/i });
    await userEvent.click(submitReplyButton);

    await waitFor(() => {
      expect(replyInput).not.toBeInTheDocument();
    });
  });
});