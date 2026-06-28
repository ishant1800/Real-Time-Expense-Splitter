import { Response } from 'express';

interface SuccessResponse<T = any> {
  status: 'success';
  message: string;
  data?: T;
}

interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: string[];
}

export class ApiResponse {
  /**
   * Send a success response.
   */
  static success<T = any>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
  ): void {
    const body: SuccessResponse<T> = {
      status: 'success',
      message,
    };
    if (data !== undefined) {
      body.data = data;
    }
    res.status(statusCode).json(body);
  }

  /**
   * Send an error response.
   */
  static error(
    res: Response,
    statusCode: number,
    message: string,
    errors?: string[]
  ): void {
    const body: ErrorResponse = {
      status: 'error',
      message,
    };
    if (errors && errors.length > 0) {
      body.errors = errors;
    }
    res.status(statusCode).json(body);
  }
}
