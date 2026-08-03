function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    req.session.flash = { type: 'error', message: '로그인이 필요합니다.' };
    return res.redirect('/login');
  }
  next();
}

module.exports = { requireAuth };
