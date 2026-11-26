import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VoteButtons } from './vote-buttons';

describe('VoteButtons', () => {
  it('shows the compact score', () => {
    render(<VoteButtons score={1532} myVote={0} onVote={vi.fn()} />);
    expect(screen.getByText('1.5K')).toBeInTheDocument();
  });

  it('upvotes and downvotes', async () => {
    const onVote = vi.fn();
    render(<VoteButtons score={3} myVote={0} onVote={onVote} />);
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }));
    await userEvent.click(screen.getByRole('button', { name: 'Downvote' }));
    expect(onVote.mock.calls).toEqual([[1], [-1]]);
  });

  it('clicking the active arrow removes the vote', async () => {
    const onVote = vi.fn();
    render(<VoteButtons score={3} myVote={1} onVote={onVote} />);
    expect(screen.getByRole('button', { name: 'Upvote' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }));
    expect(onVote).toHaveBeenCalledWith(0);
  });

  it('switches from downvote to upvote directly', async () => {
    const onVote = vi.fn();
    render(<VoteButtons score={3} myVote={-1} onVote={onVote} />);
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }));
    expect(onVote).toHaveBeenCalledWith(1);
  });
});
