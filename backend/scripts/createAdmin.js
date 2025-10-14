#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
import readline from 'readline';
import Admin from '../src/models/Admin.js';
import '../src/config/database.js';

function parseArg(name) {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1) return args[idx + 1];
  return null;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  try {
    let username = parseArg('username');
    let password = parseArg('password');

    if (!username) username = await ask('请输入管理员用户名: ');
    if (!password) password = await ask('请输入管理员密码: ');

    if (!username || !password) {
      console.error('用户名和密码均不能为空');
      process.exit(1);
    }

    const exists = await Admin.usernameExists(username);
    if (exists) {
      console.error(`用户名 ${username} 已存在`);
      process.exit(1);
    }

    await Admin.create(username, password);
    console.log(`管理员 ${username} 创建成功`);
    process.exit(0);
  } catch (error) {
    console.error('创建管理员失败:', error.message);
    process.exit(1);
  }
}

main();
