import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * عميل قاعدة بيانات مزدوج:
 * - على Cloudflare Workers: يستخدم ربط D1 عبر مهايئ PrismaD1
 * - محلياً (Sandbox/VPS): يستخدم SQLite الملفي عبر DATABASE_URL
 */

function createClient(): PrismaClient {
  // محاولة الوصول إلى سياق Cloudflare (متاح فقط داخل Workers)
  try {
    const { env } = getCloudflareContext() as { env: { DB?: D1Database } }
    if (env?.DB) {
      return new PrismaClient({ adapter: new PrismaD1(env.DB) })
    }
  } catch {
    // ليس داخل Cloudflare — نكمل مع SQLite المحلي
  }

  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL ?? 'file:./db/custom.db' },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
