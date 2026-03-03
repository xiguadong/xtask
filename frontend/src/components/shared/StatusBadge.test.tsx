import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders readable status text and style class', () => {
    render(<StatusBadge status="at_risk" />);

    const badge = screen.getByText('at risk');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-100');
  });
});
