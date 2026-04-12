import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authSso } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'heyue_box_secret';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'];

// ─── Register ───────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, email, username, password, nickname } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ code: 1, message: '密码至少6位' });
    }
    if (!phone && !email && !username) {
      return res.status(400).json({ code: 1, message: '请提供手机号、邮箱或用户名' });
    }

    if (phone) {
      const exists = await prisma.ssoUser.findUnique({ where: { phone } });
      if (exists) return res.status(400).json({ code: 1, message: '该手机号已注册' });
    }
    if (email) {
      const exists = await prisma.ssoUser.findUnique({ where: { email } });
      if (exists) return res.status(400).json({ code: 1, message: '该邮箱已注册' });
    }
    if (username) {
      const exists = await prisma.ssoUser.findUnique({ where: { username } });
      if (exists) return res.status(400).json({ code: 1, message: '该用户名已注册' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.ssoUser.create({
      data: {
        phone: phone || null,
        email: email || null,
        username: username || null,
        passwordHash,
        nickname: nickname || username || phone || email?.split('@')[0] || '',
      },
    });

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

// ─── Login ──────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { account, password } = req.body;
    if (!account || !password) {
      return res.status(400).json({ code: 1, message: '请输入账号和密码' });
    }

    const user = await prisma.ssoUser.findFirst({
      where: {
        OR: [{ phone: account }, { email: account }, { username: account }],
      },
    });
    if (!user) {
      return res.status(401).json({ code: 1, message: '账号或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ code: 1, message: '账号或密码错误' });
    }

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

// ─── Authorize (generate auth code for sub-app) ────────
router.post('/authorize', authSso, async (req: Request, res: Response) => {
  try {
    const { app_key } = req.body;
    if (!app_key) {
      return res.status(400).json({ code: 1, message: '缺少 app_key' });
    }

    const app = await prisma.ssoApp.findUnique({ where: { appKey: app_key } });
    if (!app || app.status !== 1) {
      return res.status(404).json({ code: 1, message: '应用不存在或已停用' });
    }

    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.ssoAuthCode.create({
      data: {
        code,
        ssoUserId: req.ssoUser!.id,
        appKey: app_key,
        redirectUri: app.callbackUrl,
        expiresAt,
      },
    });

    const redirectUrl = `${app.callbackUrl}?code=${code}`;

    return res.json({
      code: 0,
      data: { code, redirect_url: redirectUrl },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

// ─── Token exchange (sub-app server → SSO center) ──────
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { code, app_key, app_secret } = req.body;
    if (!code || !app_key || !app_secret) {
      return res.status(400).json({ code: 1, message: '参数不完整' });
    }

    const app = await prisma.ssoApp.findUnique({ where: { appKey: app_key } });
    if (!app || app.appSecret !== app_secret) {
      return res.status(403).json({ code: 1, message: '应用凭证无效' });
    }

    const authCode = await prisma.ssoAuthCode.findUnique({ where: { code } });
    if (!authCode) {
      return res.status(400).json({ code: 1, message: '授权码无效' });
    }
    if (authCode.used) {
      return res.status(400).json({ code: 1, message: '授权码已使用' });
    }
    if (authCode.expiresAt < new Date()) {
      return res.status(400).json({ code: 1, message: '授权码已过期' });
    }
    if (authCode.appKey !== app_key) {
      return res.status(400).json({ code: 1, message: '授权码与应用不匹配' });
    }

    await prisma.ssoAuthCode.update({ where: { code }, data: { used: true } });

    const user = await prisma.ssoUser.findUnique({ where: { id: authCode.ssoUserId } });
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }

    const binding = await prisma.ssoUserBinding.findUnique({
      where: { ssoUserId_appKey: { ssoUserId: user.id, appKey: app_key } },
    });

    return res.json({
      code: 0,
      data: {
        sso_user_id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        username: user.username,
        binding: binding ? { local_user_id: binding.localUserId } : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

// ─── Bind notification (sub-app server → SSO center) ───
router.post('/bind-notify', async (req: Request, res: Response) => {
  try {
    const { app_key, app_secret, sso_user_id, local_user_id } = req.body;
    if (!app_key || !app_secret || !sso_user_id || !local_user_id) {
      return res.status(400).json({ code: 1, message: '参数不完整' });
    }

    const app = await prisma.ssoApp.findUnique({ where: { appKey: app_key } });
    if (!app || app.appSecret !== app_secret) {
      return res.status(403).json({ code: 1, message: '应用凭证无效' });
    }

    await prisma.ssoUserBinding.upsert({
      where: { ssoUserId_appKey: { ssoUserId: sso_user_id, appKey: app_key } },
      update: { localUserId: String(local_user_id) },
      create: {
        ssoUserId: sso_user_id,
        appKey: app_key,
        localUserId: String(local_user_id),
      },
    });

    return res.json({ code: 0, data: null });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

// ─── User info ──────────────────────────────────────────
router.get('/userinfo', authSso, async (req: Request, res: Response) => {
  try {
    const user = await prisma.ssoUser.findUnique({
      where: { id: req.ssoUser!.id },
      include: {
        bindings: {
          include: { ssoApp: { select: { name: true, icon: true, url: true } } },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }

    return res.json({
      code: 0,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
        bindings: user.bindings.map((b) => ({
          appKey: b.appKey,
          appName: b.ssoApp.name,
          appIcon: b.ssoApp.icon,
          localUserId: b.localUserId,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

export default router;
