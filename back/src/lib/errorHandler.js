import logger from './logger.js';

/**
 * Classe customizada para erros da aplicação
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware centralizado de tratamento de erros
 * Deve ser registrado por último no Express
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Erro interno do servidor';

  // Log do erro
  if (err.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
      error: err.stack,
      body: req.body,
      params: req.params
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
      statusCode: err.statusCode
    });
  }

  // Erro de validação do Prisma (unique constraint, etc)
  if (err.code === 'P2002') {
    const statusCode = 409;
    const message = `Campo ${err.meta?.target?.[0] || 'desconhecido'} já existe`;
    return res.status(statusCode).json({
      error: message,
      statusCode
    });
  }

  // Erro de registro não encontrado do Prisma
  if (err.code === 'P2025') {
    const statusCode = 404;
    const message = 'Recurso não encontrado';
    return res.status(statusCode).json({
      error: message,
      statusCode
    });
  }

  // Erro de validação do Prisma
  if (err.code === 'P2003') {
    const statusCode = 400;
    const message = 'Relacionamento inválido';
    return res.status(statusCode).json({
      error: message,
      statusCode
    });
  }

  // JSON inválido
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido no corpo da requisição',
      statusCode: 400
    });
  }

  // Erro operacional da aplicação
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  // Erro não esperado
  return res.status(500).json({
    error: 'Erro interno do servidor',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
};

/**
 * Middleware para capturar 404s
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Endpoint ${req.originalUrl} não encontrado`,
    404
  );
  next(error);
};
