// src/app/api/user/profile/route.ts
// PATCH /api/user/profile  → 更新昵称
// POST  /api/user/profile  → 更新头像（base64，无需云存储）

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── PATCH：更新昵称 ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json();
  const { nickname } = body as { nickname?: string };

  if (typeof nickname !== "string") return err("nickname 参数无效");
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return err("昵称不能为空");
  if (trimmed.length > 20) return err("昵称最多 20 个字符");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { nickname: trimmed },
    select: { id: true, email: true, nickname: true, avatar: true },
  });

  return ok(user);
}

// ─── POST：上传头像（multipart form-data）────────────────
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return err("无效的请求体，请使用 multipart/form-data");
  }

  const file = formData.get("file") as File | null;
  if (!file) return err("未找到文件");

  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    return err("只允许上传图片文件");
  }

  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    return err("文件大小不能超过 5MB");
  }

  // 确定文件扩展名
  const extMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  const ext = extMap[file.type] ?? ".jpg";

  // 保存文件到 public/avatars/
  const fileName = `${userId}${ext}`;
  const avatarDir = path.join(process.cwd(), "public", "avatars");
  const filePath = path.join(avatarDir, fileName);

  try {
    await mkdir(avatarDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
  } catch (e) {
    console.error("文件写入失败:", e);
    return err("头像保存失败，请重试");
  }

  const avatarUrl = `/avatars/${fileName}`;

  // 更新数据库
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  });

  return ok({ url: avatarUrl });
}
