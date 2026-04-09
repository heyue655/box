import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// 根据环境读取配置
const isProd = process.env.NODE_ENV === 'production';

const apps = [
  {
    appKey: 'txsy',
    name: '太虚书院',
    description: '与古典名著角色深度对话',
    icon: '/icons/txsy.svg',
    url: isProd ? 'https://txsy.pinyanzhi.net' : 'http://localhost:3003',
    callbackUrl: isProd
      ? 'https://txsy.pinyanzhi.net/api/h5/auth/sso-callback'
      : 'http://localhost:3003/api/h5/auth/sso-callback',
  },
  {
    appKey: 'game-helper',
    name: '速心电竞',
    description: '游戏代练与陪玩服务平台',
    icon: '/icons/game-helper.svg',
    url: isProd ? 'https://game.pinyanzhi.net' : 'http://localhost:3000',
    callbackUrl: isProd
      ? 'https://game.pinyanzhi.net/api/auth/sso-callback'
      : 'http://localhost:3000/api/auth/sso-callback',
  },
  {
    appKey: 'credit-card',
    name: '留金计划',
    description: '信用卡还款计划与财务管理',
    icon: '/icons/credit-card.svg',
    url: isProd ? 'https://fund.pinyanzhi.net' : 'http://localhost:3005',
    callbackUrl: isProd
      ? 'https://fund.pinyanzhi.net/api/auth/sso-callback'
      : 'http://localhost:5000/api/auth/sso-callback',
  },
];

async function main() {
  console.log('Seeding SSO apps...\n');

  for (const app of apps) {
    const appSecret = crypto.randomBytes(32).toString('hex');
    const result = await prisma.ssoApp.upsert({
      where: { appKey: app.appKey },
      update: {
        name: app.name,
        description: app.description,
        icon: app.icon,
        url: app.url,
        callbackUrl: app.callbackUrl,
      },
      create: { ...app, appSecret },
    });

    console.log(`✓ ${result.name}`);
    console.log(`  app_key:    ${result.appKey}`);
    console.log(`  app_secret: ${result.appSecret}`);
    console.log(`  url:        ${result.url}`);
    console.log(`  callback:   ${result.callbackUrl}`);
    console.log('');
  }

  console.log('Done! Copy each app_key and app_secret to the corresponding sub-app .env file.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
