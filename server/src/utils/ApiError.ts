class ApiError extends Error {
  statusCode: number
  data: any
  success: boolean
  errors: string[]
  code?: string

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: string[] = [],
    code?: string,
    stack?: string
  ) {
    super(message)

    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors
    if (code) this.code = code

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export { ApiError }
