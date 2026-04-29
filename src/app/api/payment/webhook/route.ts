// src/app/api/payment/webhook/route.ts
// 虎皮椒支付回调：验签 → 更新订单 → 升级用户套餐

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => { params[key] = value.toString(); });

  // 1. 验签
  if (!verifyWebhook(params)) {
    return new Response("sign error", { status: 400 });
  }

  const orderId = params.trade_order_id;
  const status = params.status; // "OD" = 支付成功

  if (status !== "OD") {
    return new Response("ok"); // 非成功状态忽略
  }

  // 2. 更新支付记录 + 升级套餐（事务）
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status === "SUCCESS") return; // 幂等

    await tx.payment.update({
      where: { orderId },
      data: { status: "SUCCESS", paidAt: new Date() },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: { plan: "PRO" },
    });
  });

  return new Response("success");
}
