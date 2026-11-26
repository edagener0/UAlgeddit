import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError, errorMessage } from './api-client';

/** Maps API validation errors onto form fields, falling back to a toast. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  let mapped = false;
  if (error instanceof ApiError) {
    for (const detail of error.details) {
      if ((fields as readonly string[]).includes(detail.path)) {
        setError(detail.path as Path<T>, { message: detail.message });
        mapped = true;
      }
    }
  }
  if (!mapped) toast.error(errorMessage(error));
}
