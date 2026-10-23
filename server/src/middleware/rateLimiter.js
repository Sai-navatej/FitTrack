// In-memory sliding window rate limiter
const ipRequestCounts = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins default
  const max = options.max || 100; // 100 requests per window
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return (req, res, next) => {
    // In dev/test environments, allow more generous limits
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    ipRequestCounts.set(ip, record);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

module.exports = rateLimiter;
