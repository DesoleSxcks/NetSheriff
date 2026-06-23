/**
 * Wrapper para envolver funções assíncronas em rotas Express
 * Captura erros automaticamente e passa para o middleware de erro
 * 
 * Uso:
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Versão alternativa usando try/catch (se preferir)
 * Não é necessário usar ambas, escolha uma estratégia
 */
export const asyncHandlerWithTryCatch = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
