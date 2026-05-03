export class AppError extends Error {
  public statusCode: number
  public code?: string

  constructor(message: string, statusCode = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
