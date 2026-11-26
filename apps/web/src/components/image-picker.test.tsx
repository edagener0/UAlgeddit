import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ImagePicker } from './image-picker';

function Harness({ max = 3 }: { max?: number }) {
  const [files, setFiles] = useState<File[]>([]);
  return <ImagePicker files={files} onChange={setFiles} max={max} />;
}

const png = (name: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });

describe('ImagePicker', () => {
  it('adds previews and removes images', async () => {
    render(<Harness />);
    await userEvent.upload(screen.getByTestId('image-input'), [png('a.png'), png('b.png')]);
    expect(screen.getAllByRole('img')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('rejects unsupported types', async () => {
    render(<Harness />);
    const svg = new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' });
    await userEvent.upload(screen.getByTestId('image-input'), svg, { applyAccept: false });
    expect(screen.getByRole('alert')).toHaveTextContent('not a JPEG, PNG, GIF or WebP');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('rejects files larger than 5 MB', async () => {
    render(<Harness />);
    await userEvent.upload(screen.getByTestId('image-input'), png('huge.png', 6 * 1024 * 1024));
    expect(screen.getByRole('alert')).toHaveTextContent('larger than 5 MB');
  });

  it('enforces the maximum number of images and hides the drop zone when full', async () => {
    render(<Harness max={2} />);
    await userEvent.upload(screen.getByTestId('image-input'), [
      png('1.png'),
      png('2.png'),
      png('3.png'),
    ]);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('at most 2 images');
    expect(screen.queryByText(/click to upload/i)).not.toBeInTheDocument();
  });

  it('reorders images', async () => {
    render(<Harness />);
    await userEvent.upload(screen.getByTestId('image-input'), [
      png('first.png'),
      png('second.png'),
    ]);
    await userEvent.click(screen.getAllByRole('button', { name: 'Move right' })[0]!);
    expect(screen.getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual([
      'second.png',
      'first.png',
    ]);
  });
});
