import { Request, Response, NextFunction } from "express"

const asyncHandler = <T extends Request = Request>(
  requestHandler: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req as T, res, next)).catch((err) =>
      next(err)
    )
  }
}

export { asyncHandler }
