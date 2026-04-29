// src/app/api/auth/login/route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ok, err } from "@/lib/utils";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return err("邮箱和密码不能为空");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.passwordHash !== hashPassword(password)) {
    return err("邮箱或密码错误", 401);
  }

  const token = await signToken({ userId: user.id, email: user.email, plan: user.plan });

  return ok({ token, user: { id: user.id, email: user.email, plan: user.plan } });
}
