const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration, validatePost } = require('../src/lib/validation');

test('회원 아이디와 비밀번호를 검증한다', () => {
  assert.equal(validateRegistration('user_01', 'password123'), null);
  assert.match(validateRegistration('한글아이디', 'password123'), /아이디/);
  assert.match(validateRegistration('user', 'short'), /비밀번호/);
});

test('게시글 제목과 내용을 검증한다', () => {
  assert.equal(validatePost('제목', '내용입니다.'), null);
  assert.match(validatePost('', '내용'), /제목/);
  assert.match(validatePost('제목', ''), /내용/);
  assert.match(validatePost('가'.repeat(121), '내용'), /제목/);
});
