import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Accessible confirmation dialog built on the native <dialog> element. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-fg-muted">{description}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={loading} onClick={onConfirm}>
              {confirmLabel ?? t('common.delete')}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
