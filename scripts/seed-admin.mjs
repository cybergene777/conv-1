// scripts/seed-admin.mjs
// 创建测试用超级用户（PRO 套餐，不受次数限制）
// 用法：node scripts/seed-admin.mjs

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const EMAIL    = "admin@test.com";
const PASSWORD = "admin1234";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (existing) {
    // 已存在则直接升级为 PRO
    await prisma.user.update({
      where: { email: EMAIL },
      data: { plan: "PRO", dailyCount: 0 },
    });
    console.log(`✓ 已将 ${EMAIL} 升级为 PRO`);
  } else {
    await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash: hashPassword(PASSWORD),
        plan: "PRO",
      },
    });
    console.log(`✓ 超级测试用户创建成功`);
  }

  console.log(`  邮箱：${EMAIL}`);
  console.log(`  密码：${PASSWORD}`);
  console.log(`  套餐：PRO（无次数限制）`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
