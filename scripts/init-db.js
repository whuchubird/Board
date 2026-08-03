require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const pool = require('../src/db');

async function initialize() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 환경 변수가 필요합니다.');
  const schema = await fs.readFile(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('데이터베이스 테이블을 준비했습니다.');
}

initialize()
  .catch((error) => {
    console.error('데이터베이스 초기화 실패:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
