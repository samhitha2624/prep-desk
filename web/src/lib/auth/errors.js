// Errors shown to the person using the app. API errors arrive as { error: { code, message } }.
export class AppError extends Error {
  constructor(message, code = 'unknown', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const NETWORK_MESSAGE = 'Could not reach the Prep Desk server. Check that the API is running and try again.';
