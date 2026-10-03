// Errors with an HTTP status and a message that is safe to show to the person using the app.
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (code, message) => new HttpError(400, code, message);
export const unauthorized = () => new HttpError(401, 'not-signed-in', 'Log in first.');
export const forbidden = () => new HttpError(403, 'forbidden', 'Only admins can do that.');
export const notFound = (what = 'That item') => new HttpError(404, 'not-found', `${what} was not found.`);
export const conflict = (code, message) => new HttpError(409, code, message);

// Express error handler: known errors become { error: { code, message } }, anything else is a 500.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'bad-json', message: 'The request body is not valid JSON.' } });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'too-large', message: 'That request is too large.' } });
  console.error(err);
  res.status(500).json({ error: { code: 'server-error', message: 'Something went wrong on the server. Try again.' } });
}
