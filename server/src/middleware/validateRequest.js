export function validateRequest(validator) {
  return (req, _res, next) => {
    try {
      validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
