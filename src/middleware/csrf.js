const crypto = require('crypto');

function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.body?._csrf || req.get('x-csrf-token');
    const expected = req.session.csrfToken;
    const valid = typeof token === 'string'
      && token.length === expected.length
      && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

    if (!valid) {
      const error = new Error('잘못된 요청입니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.');
      error.status = 403;
      return next(error);
    }
  }

  next();
}

module.exports = csrfProtection;
