// src/app/api/auth/register/route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ok, err } from "@/lib/utils";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
  // TODO: 生产环境替换为 bcrypt
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) return err("邮箱和密码不能为空");
  if (password.length < 8) return err("密码至少 8 位");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return err("该邮箱已注册");

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password) },
  });

  const token = await signToken({ userId: user.id, email: user.email, plan: user.plan });

  return ok({ token, user: { id: user.id, email: user.email, plan: user.plan } });
}
