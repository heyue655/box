import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authSso } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// List all active apps (for portal display)
router.get('/', authSso, async (_req: Request, res: Response) => {
  try {
    const apps = await prisma.ssoApp.findMany({
      where: { status: 1 },
      select: {
        appKey: true,
        name: true,
        description: true,
        icon: true,
        url: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ code: 0, data: apps });
  } catch (err: any) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

export default router;
