export class Success<T> {
  readonly isSuccess = true as const
  readonly isFailure = false as const

  constructor(readonly value: T) {
    Object.freeze(this)
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value))
  }

  flatMap<U, E2>(fn: (value: T) => Result<U, E2>): Result<U, E2> {
    return fn(this.value)
  }

  getOrElse(_defaultValue: T): T {
    return this.value
  }

  getOrThrow(): T {
    return this.value
  }
}

export class Failure<E> {
  readonly isSuccess = false as const
  readonly isFailure = true as const

  constructor(readonly error: E) {
    Object.freeze(this)
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>
  }

  flatMap<U, E2>(_fn: (value: never) => Result<U, E2>): Result<U, E | E2> {
    return this as unknown as Result<U, E | E2>
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue
  }

  getOrThrow(): never {
    throw this.error
  }
}

export type Result<T, E> = Success<T> | Failure<E>

export function success<T>(value: T): Success<T> {
  return new Success(value)
}

export function failure<E>(error: E): Failure<E> {
  return new Failure(error)
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.isSuccess
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.isFailure
}
