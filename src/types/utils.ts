/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Mutable type (removes readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Value of object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Ensure array type
 */
export type EnsureArray<T> = T extends unknown[] ? T : T[];

/**
 * Callback function type
 */
export type Callback<T = void> = T extends void ? () => void : (arg: T) => void;

/**
 * Async callback function type
 */
export type AsyncCallback<T = void> = T extends void ? () => Promise<void> : (arg: T) => Promise<void>;

/**
 * Error with code
 */
export interface CodedError extends Error {
  code: string;
  details?: unknown;
}