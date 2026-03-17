import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_HEADER } from '../constants.js';

export const RequestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers[REQUEST_ID_HEADER]) req.headers[REQUEST_ID_HEADER] = uuidv4();

  res.set(REQUEST_ID_HEADER, req.headers.REQUEST_ID_HEADER);

  next();
};
