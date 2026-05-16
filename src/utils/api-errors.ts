import axios from 'axios';

type SpringFieldError = {
  field?: string;
  defaultMessage?: string;
  message?: string;
};

type SpringErrorPayload = {
  error?: string;
  message?: string;
  errors?: SpringFieldError[];
};

export type ParsedApiError = {
  title: string;
  message: string;
  fieldErrors?: Record<string, string>;
  status?: number;
};

/**
 * Normalizes Spring Boot error envelopes so forms and API callers can handle
 * field-level and generic errors in one shape.
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (!axios.isAxiosError<SpringErrorPayload>(error)) {
    return {
      title: 'Error',
      message: 'Network error',
    };
  }

  const data = error.response?.data;
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(data?.errors)) {
    data.errors.forEach((fieldError) => {
      if (fieldError.field) {
        fieldErrors[fieldError.field] =
          fieldError.defaultMessage ?? fieldError.message ?? 'Invalid value';
      }
    });
  }

  return {
    title: data?.error ?? 'Error',
    message: data?.message ?? error.message ?? 'An unexpected error occurred',
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
    status: error.response?.status,
  };
}
