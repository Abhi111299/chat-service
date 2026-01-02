const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        ...req.body,
        ...req.query,
        ...req.params
      });

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors
        });
      }

      req.validated = result.data;
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }
  };
};

module.exports = validate;

