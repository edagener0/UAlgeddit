import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ImageGallery } from './image-gallery';

const images = [1, 2, 3].map((id) => ({ id, url: `/uploads/${id}.png`, position: id - 1 }));

describe('ImageGallery', () => {
  it('renders a single image without carousel controls', () => {
    render(<ImageGallery images={images.slice(0, 1)} alt="Sunset" />);
    expect(screen.getByRole('img', { name: 'Sunset (1 of 1)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
  });

  it('navigates forwards, backwards and wraps around', async () => {
    render(<ImageGallery images={images} alt="Trip" />);
    expect(screen.getByText('1/3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('2/3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Trip (3 of 3)' })).toHaveAttribute(
      'src',
      '/uploads/3.png',
    );
  });

  it('jumps to an image from the dots', async () => {
    render(<ImageGallery images={images} alt="Trip" />);
    await userEvent.click(screen.getByRole('button', { name: 'Show image 3' }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('opens a lightbox that closes with Escape', async () => {
    render(<ImageGallery images={images} alt="Trip" />);
    await userEvent.click(screen.getByRole('button', { name: /open image 1 of 3/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Trip - image 2 of 3');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
