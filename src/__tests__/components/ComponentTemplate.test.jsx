import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/test-utils';

// Example component to test
const ExampleComponent = ({ onSubmit }) => (
  <div>
    <h1>Example Form</h1>
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(e.target.input.value);
    }}>
      <input name="input" placeholder="Enter text" />
      <button type="submit">Submit</button>
    </form>
  </div>
);

describe('ExampleComponent', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<ExampleComponent onSubmit={() => {}} />);
      expect(screen.getByText('Example Form')).toBeInTheDocument();
    });

    it('displays form elements', () => {
      renderWithProviders(<ExampleComponent onSubmit={() => {}} />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles form submission', async () => {
      const mockSubmit = jest.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<ExampleComponent onSubmit={mockSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter text');
      await user.type(input, 'test value');
      await user.click(screen.getByRole('button'));
      
      expect(mockSubmit).toHaveBeenCalledWith('test value');
    });
  });
});