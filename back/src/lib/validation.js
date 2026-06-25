function buildErrorMessages(target, schema) {
  const errors = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = target[field];

    if (rule.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} é obrigatório`);
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    if (rule.type === 'string') {
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${field} deve ser uma string válida`);
      } else if (rule.minLength && value.trim().length < rule.minLength) {
        errors.push(`${field} deve ter pelo menos ${rule.minLength} caracteres`);
      } else if (rule.maxLength && value.trim().length > rule.maxLength) {
        errors.push(`${field} deve ter no máximo ${rule.maxLength} caracteres`);
      }
    } else if (rule.type === 'integer') {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < (rule.min ?? 1)) {
        errors.push(`${field} deve ser um inteiro válido`);
      }
    } else if (rule.type === 'number') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || (rule.min !== undefined && parsed < rule.min)) {
        errors.push(`${field} deve ser um número válido`);
      }
    } else if (rule.type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors.push(`${field} deve ser um valor booleano`);
      }
    } else if (rule.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${field} deve ser um array`);
      }
    } else if (rule.type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`${field} deve ser um objeto`);
      }
    }

    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${field} possui um valor inválido`);
    }
  }

  return errors;
}

function sanitizeObject(target, schema) {
  const sanitized = {};

  for (const [field, rule] of Object.entries(schema)) {
    if (target[field] === undefined) {
      continue;
    }

    if (typeof target[field] === 'string') {
      sanitized[field] = target[field].trim();
    } else if (rule.type === 'integer' && target[field] !== undefined) {
      sanitized[field] = Number(target[field]);
    } else {
      sanitized[field] = target[field];
    }
  }

  return sanitized;
}

export function validateBody(schema) {
  return (req, res, next) => {
    const errors = buildErrorMessages(req.body ?? {}, schema);

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }

    req.body = sanitizeObject(req.body ?? {}, schema);
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const errors = buildErrorMessages(req.params ?? {}, schema);

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos', details: errors });
    }

    req.params = sanitizeObject(req.params ?? {}, schema);
    next();
  };
}
