// src/lib/payment.ts
// 虎皮椒支付封装（无需 SDK，纯 HTTP）
// 文档：https://xunhupay.com/doc

import crypto from "crypto";

const APP_ID = process.env.HUPIJIAO_APP_ID!;
const APP_SECRET = process.env.HUPIJIAO_APP_SECRET!;
const CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL!;
const API_URL = "https://api.xunhupay.com/payment/do.html";

interface CreateOrderParams {
  orderId: string;    // 业务侧唯一订单号
  amount: number;     // 金额（元，如 19.00）
  title: string;      // 商品标题
  attach?: string;    // 附加数据，原样回传（可存 userId）
}

interface OrderResult {
  payUrl: string;     // 跳转/扫码地址
  qrUrl?: string;     // 二维码图片地址（部分渠道）
}

/** 生成签名：按参数名升序拼接 + secret */
function sign(params: Record<string, string>): string {
  const str =
    Object.keys(params)
      .sort()
      .filter((k) => params[k] !== "" && k !== "sign")
      .map((k) => `${k}=${params[k]}`)
      .join("&") + `&key=${APP_SECRET}`;

  return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
}

/** 创建虎皮椒订单，返回支付链接 */
export async function createOrder(params: CreateOrderParams): Promise<OrderResult> {
  const body: Record<string, string> = {
    appid: APP_ID,
    trade_order_id: params.orderId,
    total_fee: params.amount.toFixed(2),
    title: params.title,
    notify_url: CALLBACK_URL,
    nonce_str: Math.random().toString(36).slice(2),
    attach: params.attach ?? "",
    time: Math.floor(Date.now() / 1000).toString(),
    type: "WAP", // WAP=H5, NATIVE=扫码
  };
  body.sign = sign(body);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  const data = await res.json();
  if (data.errcode !== 0) throw new Error(`虎皮椒建单失败: ${data.errmsg}`);

  return {
    payUrl: data.url,
    qrUrl: data.qrcode,
  };
}

/** 验证 Webhook 签名（防伪造回调） */
export function verifyWebhook(params: Record<string, string>): boolean {
  const received = params.sign;
  const expected = sign(params);
  return received === expected;
}
