/**
 * Errores de negocio. Los servicios los lanzan y el middleware de errores
 * los traduce a la respuesta HTTP correspondiente.
 */
export class AppError extends Error {
    constructor(public readonly status: number, message: string, public readonly details?: unknown) {
        super(message);
        this.name = new.target.name;
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, details?: unknown) {
        super(400, message, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(401, message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string) {
        super(403, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(404, message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, message);
    }
}
