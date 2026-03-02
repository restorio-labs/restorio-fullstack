export type ParamTypes = Record<string | number | symbol, string | number | Date>;

export interface SuccessResponse<T> {
  message?: string;
  data: T;
}

export interface CreatedResponse<T> {
  message: string;
  data: T;
}

export interface UpdatedResponse<T> {
  message: string;
  data: T;
}
