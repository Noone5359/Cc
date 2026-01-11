import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from '@components/common/PageHeader';

describe('PageHeader', () => {
  it('renders the title correctly', () => {
    render(<PageHeader title="Dashboard" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Dashboard');
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Dashboard" subtitle="Welcome back!" />);

    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<PageHeader title="Dashboard" />);

    // Query for p element - should not exist
    const subtitle = screen.queryByText(/./i, { selector: 'p' });
    expect(subtitle).not.toBeInTheDocument();
  });

  it('renders children (action buttons) when provided', () => {
    render(
      <PageHeader title="Dashboard">
        <button>Action 1</button>
        <button>Action 2</button>
      </PageHeader>
    );

    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
  });

  it('does not render actions container when no children', () => {
    const { container } = render(<PageHeader title="Dashboard" />);

    // The flex container for actions shouldn't exist
    const actionsContainer = container.querySelector('.flex.flex-wrap.gap-2');
    expect(actionsContainer).not.toBeInTheDocument();
  });

  it('applies gradient styling to title', () => {
    render(<PageHeader title="Test Title" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('bg-gradient-to-r');
  });
});
