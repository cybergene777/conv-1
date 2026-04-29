// src/app/api/payment/create/route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/payment";
import { ok, err } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return err("Unauthorized", 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return err("用户不存在", 404);
  if (user.plan === "PRO") return err("您已是 Pro 用户");

  // 生成唯一订单号
  const orderId = `CONV1_${userId}_${Date.now()}`;

  // 记录到数据库
  await prisma.payment.create({
    data: {
      userId,
      orderId,
      amount: 1900, // 19.00 元 = 1900 分
      plan: "PRO",
    },
  });

  // 调用虎皮椒建单
  const { payUrl, qrUrl } = await createOrder({
    orderId,
    amount: 19.0,
    title: "Conv:1 Pro 月度会员",
    attach: userId,
  });

  return ok({ orderId, payUrl, qrUrl });
}
