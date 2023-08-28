export class ApiError extends Error {
  cause?: Response;
}