export default function errorHandler(err, _req, res, _next) {
  if (err.code === 11000) {
    const duplicateEmail = Boolean(err.keyPattern?.email);
    return res
      .status(409)
      .json({
        message: duplicateEmail
          ? "Email address already exists."
          : "Employee ID already exists.",
      });
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ message: err.message });
  }
  return res
    .status(err.status || 500)
    .json({
      message: err.status
        ? err.message
        : "Something went wrong. Please try again.",
    });
}
