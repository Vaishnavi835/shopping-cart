/**
 * sanitize.js — Custom input sanitization middleware
 *
 * Protects against NoSQL injection by stripping MongoDB operators
 * (keys starting with '$' or containing '.') from req.body, req.query, and req.params.
 */

// Recursively remove keys that start with '$' or contain '.'
function sanitizeObject(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const key of Object.keys(obj)) {
    // Block MongoDB operators like $gt, $ne, $regex, etc.
    if (key.startsWith("$") || key.includes(".")) {
      continue; // skip dangerous keys
    }
    clean[key] = sanitizeObject(obj[key]);
  }
  return clean;
}

// Express middleware
const sanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitize;

