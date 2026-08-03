const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;

function validateRegistration(username, password) {
  if (!USERNAME_PATTERN.test(username)) {
    return '아이디는 영문, 숫자, 밑줄을 사용해 3~30자로 입력해 주세요.';
  }
  if (password.length < 8 || password.length > 72) {
    return '비밀번호는 8~72자로 입력해 주세요.';
  }
  return null;
}

function validatePost(title, content) {
  if (!title || title.length > 120) {
    return '제목은 1~120자로 입력해 주세요.';
  }
  if (!content || content.length > 10000) {
    return '내용은 1~10,000자로 입력해 주세요.';
  }
  return null;
}

module.exports = { validateRegistration, validatePost };
