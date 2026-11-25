#!/usr/bin/env node
// 관리자 비밀번호를 환경변수 ADMIN_PASSWORD_HASH 값으로 바꿔 준다. 비밀번호 자체는 어디에도 저장하지 않는다.
// 사용: node scripts/hash-password.mjs            (입력 프롬프트)
//       node scripts/hash-password.mjs --secret   (SESSION_SECRET용 무작위 문자열도 함께 출력)
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';

const ITER = 100000; // Cloudflare Workers의 PBKDF2 최대 반복 횟수
const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question('관리자 비밀번호: ', (pw) => {
  rl.close();
  if (!pw) return console.error('비밀번호가 비어 있습니다.');
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(pw, salt, ITER, 32, 'sha256');
  console.log('\nADMIN_PASSWORD_HASH=' + ['pbkdf2', ITER, salt.toString('base64'), hash.toString('base64')].join('$'));
  if (process.argv.includes('--secret')) console.log('SESSION_SECRET=' + randomBytes(32).toString('base64url'));
});
