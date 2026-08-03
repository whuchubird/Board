const express = require('express');
const pool = require('../db');
const asyncHandler = require('../lib/async-handler');
const { requireAuth } = require('../middleware/auth');
const { validatePost } = require('../lib/validation');

const router = express.Router();

router.param('id', (req, res, next, id) => {
  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(404).render('error', {
      title: '글을 찾을 수 없음', status: 404, message: '올바르지 않은 게시글 번호입니다.',
    });
  }
  next();
});

router.get('/', asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT posts.id, posts.title, posts.content, posts.created_at, posts.updated_at,
           users.username AS author
    FROM posts
    JOIN users ON users.id = posts.author_id
    ORDER BY posts.created_at DESC
  `);
  res.render('posts/index', { title: '모든 글', posts: result.rows });
}));

router.get('/new', requireAuth, (req, res) => {
  res.render('posts/form', {
    title: '새 글 쓰기', heading: '새 글 쓰기', action: '/posts', post: {}, error: null,
  });
});

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const error = validatePost(title, content);
  if (error) {
    return res.status(400).render('posts/form', {
      title: '새 글 쓰기', heading: '새 글 쓰기', action: '/posts', post: { title, content }, error,
    });
  }

  const result = await pool.query(
    'INSERT INTO posts (author_id, title, content) VALUES ($1, $2, $3) RETURNING id',
    [req.session.user.id, title, content],
  );
  req.session.flash = { type: 'success', message: '게시글을 등록했습니다.' };
  res.redirect(`/posts/${result.rows[0].id}`);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT posts.id, posts.author_id, posts.title, posts.content,
           posts.created_at, posts.updated_at, users.username AS author
    FROM posts
    JOIN users ON users.id = posts.author_id
    WHERE posts.id = $1
  `, [req.params.id]);
  if (!result.rows[0]) return res.status(404).render('error', { title: '글을 찾을 수 없음', status: 404, message: '요청한 게시글이 없습니다.' });
  res.render('posts/show', { title: result.rows[0].title, post: result.rows[0] });
}));

router.get('/:id/edit', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT id, author_id, title, content FROM posts WHERE id = $1', [req.params.id]);
  const post = result.rows[0];
  if (!post) return res.status(404).render('error', { title: '글을 찾을 수 없음', status: 404, message: '요청한 게시글이 없습니다.' });
  if (String(post.author_id) !== String(req.session.user.id)) {
    return res.status(403).render('error', { title: '권한 없음', status: 403, message: '작성자만 수정할 수 있습니다.' });
  }
  res.render('posts/form', {
    title: '글 수정', heading: '글 수정', action: `/posts/${post.id}/edit`, post, error: null,
  });
}));

router.post('/:id/edit', requireAuth, asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const error = validatePost(title, content);
  if (error) {
    return res.status(400).render('posts/form', {
      title: '글 수정', heading: '글 수정', action: `/posts/${req.params.id}/edit`,
      post: { id: req.params.id, title, content }, error,
    });
  }

  const result = await pool.query(`
    UPDATE posts SET title = $1, content = $2, updated_at = NOW()
    WHERE id = $3 AND author_id = $4 RETURNING id
  `, [title, content, req.params.id, req.session.user.id]);
  if (!result.rows[0]) return res.status(403).render('error', { title: '권한 없음', status: 403, message: '존재하지 않는 글이거나 수정 권한이 없습니다.' });
  req.session.flash = { type: 'success', message: '게시글을 수정했습니다.' };
  res.redirect(`/posts/${req.params.id}`);
}));

router.post('/:id/delete', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'DELETE FROM posts WHERE id = $1 AND author_id = $2 RETURNING id',
    [req.params.id, req.session.user.id],
  );
  if (!result.rows[0]) return res.status(403).render('error', { title: '권한 없음', status: 403, message: '존재하지 않는 글이거나 삭제 권한이 없습니다.' });
  req.session.flash = { type: 'success', message: '게시글을 삭제했습니다.' };
  res.redirect('/posts');
}));

module.exports = router;
