const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const asyncHandler = require('../lib/async-handler');
const { validateRegistration } = require('../lib/validation');

const router = express.Router();

router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/posts');
  res.render('auth/register', { title: '회원가입', error: null, values: {} });
});

router.post('/register', asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const error = validateRegistration(username, password);

  if (error) {
    return res.status(400).render('auth/register', {
      title: '회원가입', error, values: { username },
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash],
    );
    await new Promise((resolve, reject) => {
      req.session.regenerate((sessionError) => sessionError ? reject(sessionError) : resolve());
    });
    req.session.user = result.rows[0];
    req.session.flash = { type: 'success', message: '가입을 환영합니다!' };
    await new Promise((resolve, reject) => {
      req.session.save((sessionError) => sessionError ? reject(sessionError) : resolve());
    });
    return res.redirect('/posts');
  } catch (dbError) {
    if (dbError.code === '23505') {
      return res.status(409).render('auth/register', {
        title: '회원가입', error: '이미 사용 중인 아이디입니다.', values: { username },
      });
    }
    throw dbError;
  }
}));

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/posts');
  res.render('auth/login', { title: '로그인', error: null, values: {} });
});

router.post('/login', asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const result = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username],
  );
  const user = result.rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!passwordMatches) {
    return res.status(401).render('auth/login', {
      title: '로그인', error: '아이디 또는 비밀번호가 올바르지 않습니다.', values: { username },
    });
  }

  const requestedReturnTo = req.session.returnTo || '/posts';
  const returnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//')
    ? requestedReturnTo
    : '/posts';
  await new Promise((resolve, reject) => {
    req.session.regenerate((sessionError) => sessionError ? reject(sessionError) : resolve());
  });
  req.session.user = { id: user.id, username: user.username };
  req.session.flash = { type: 'success', message: `${user.username}님, 반갑습니다.` };
  await new Promise((resolve, reject) => {
    req.session.save((sessionError) => sessionError ? reject(sessionError) : resolve());
  });
  res.redirect(returnTo);
}));

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('board.sid');
    res.redirect('/posts');
  });
});

module.exports = router;
