require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const pool = require('./db');
const csrfProtection = require('./middleware/csrf');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error('DATABASE_URL과 SESSION_SECRET 환경 변수가 필요합니다.');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  name: 'board.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  res.locals.formatDate = (value) => new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
  delete req.session.flash;
  next();
});

app.get('/', (req, res) => res.redirect('/posts'));
app.use(authRoutes);
app.use('/posts', postRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: '페이지를 찾을 수 없음', status: 404, message: '요청한 페이지가 없습니다.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).render('error', {
    title: '오류', status: error.status || 500,
    message: error.status ? error.message : '잠시 후 다시 시도해 주세요.',
  });
});

if (require.main === module) {
  app.listen(port, () => console.log(`게시판: http://localhost:${port}`));
}

module.exports = app;
