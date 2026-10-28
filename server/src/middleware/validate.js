import ApiError from '../utils/ApiError.js';

const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));

/**
 * Zod powered request validation.
 *
 * Usage: `router.post('/', validate({ body: createIssueSchema }), handler)`
 *
 * Parsed output is attached to `req.valid.<body|query|params>`. We intentionally
 * never overwrite `req.query` because Express exposes it through a getter.
 */
export const validate = (schemas = {}) => (req, _res, next) => {
  const valid = { body: req.body, query: req.query, params: req.params };

  for (const key of ['params', 'query', 'body']) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      return next(
        ApiError.badRequest('Validation failed. Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          details: formatIssues(result.error),
        }),
      );
    }
    valid[key] = result.data;
  }

  req.valid = valid;
  return next();
};

export default validate;
