export class FrontendHttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "FrontendHttpError";
    this.status = status;
    this.code = code;
  }
}

export async function parseApiError(response: Response): Promise<FrontendHttpError> {
  let message = `HTTP ${response.status}`;
  let code: string | undefined;

  try {
    const payload = (await response.json()) as { error?: string; code?: string };
    if (payload.error && payload.error.trim().length > 0) {
      message = payload.error;
    }
    if (payload.code && payload.code.trim().length > 0) {
      code = payload.code;
    }
  } catch {
    // ignore JSON parse failures and keep default message
  }

  return new FrontendHttpError(message, response.status, code);
}
