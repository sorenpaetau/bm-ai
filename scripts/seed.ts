import { sql } from "../src/lib/db";
import { randomCode } from "../src/lib/codes";
import { DEMO_COMPANY, DEMO_CONTENT, DEMO_PRODUCT } from "../src/lib/demo";
import bcrypt from "bcryptjs";

// Seeds a demo manufacturer, a published demo product with 10 tags and some sample taps,
// plus a B&M.ai admin. Safe to re-run: it skips anything that already exists.
//
// Logins. Locally they default to the passwords below. On a public deploy (VERCEL is set) a login is
// only created when its password env var is set, so a preview never ships a well-known admin password.
//   demo@ridgeline.example / demo1234   (manufacturer admin)  DEMO_PASSWORD
//   admin@bm.example       / admin1234  (B&M.ai staff)        ADMIN_PASSWORD

async function main() {
  let [company] = await sql<{ id: string }[]>`SELECT id FROM companies WHERE name = ${DEMO_COMPANY.name}`;
  if (!company) {
    [company] = await sql<{ id: string }[]>`
      INSERT INTO companies (name, vertical, city, state, website, verified_at, plan)
      VALUES (${DEMO_COMPANY.name}, ${DEMO_COMPANY.vertical}, ${DEMO_COMPANY.city}, ${DEMO_COMPANY.state},
              ${DEMO_COMPANY.website}, now(), 'silver')
      RETURNING id`;
  }

  const deployed = Boolean(process.env.VERCEL);
  const demoPassword = process.env.DEMO_PASSWORD ?? (deployed ? undefined : "demo1234");
  const adminPassword = process.env.ADMIN_PASSWORD ?? (deployed ? undefined : "admin1234");

  const users = [
    { email: "demo@ridgeline.example", password: demoPassword, role: "admin", companyId: company.id, first: "Maria", last: "Alvarez" },
    { email: "admin@bm.example", password: adminPassword, role: "bm_admin", companyId: null, first: "B&M", last: "Admin" },
  ];
  for (const u of users) {
    if (!u.password) continue;
    await sql`
      INSERT INTO users (company_id, email, password_hash, first_name, last_name, role)
      VALUES (${u.companyId}, ${u.email}, ${await bcrypt.hash(u.password, 10)}, ${u.first}, ${u.last}, ${u.role})
      ON CONFLICT (email) DO NOTHING`;
  }

  let [product] = await sql<{ id: string }[]>`SELECT id FROM products WHERE slug = ${DEMO_PRODUCT.slug}`;
  if (product && DEMO_CONTENT.hero.imageUrl) {
    // Demo databases seeded before the bottle illustration existed get it added, without touching edits.
    const image = sql.json(DEMO_CONTENT.hero.imageUrl);
    await sql`
      UPDATE products SET
        content = CASE WHEN content->'hero' ? 'imageUrl' THEN content ELSE jsonb_set(content, '{hero,imageUrl}', ${image}) END,
        published_content = CASE WHEN published_content->'hero' ? 'imageUrl' THEN published_content
                                 ELSE jsonb_set(published_content, '{hero,imageUrl}', ${image}) END
      WHERE id = ${product.id}`;
  }
  if (!product) {
    [product] = await sql<{ id: string }[]>`
      INSERT INTO products (company_id, sku, name, description, slug, status, content, published_content, published_at)
      VALUES (${company.id}, ${DEMO_PRODUCT.sku}, ${DEMO_PRODUCT.name}, ${DEMO_PRODUCT.description}, ${DEMO_PRODUCT.slug},
              'published', ${sql.json(DEMO_CONTENT)}, ${sql.json(DEMO_CONTENT)}, now())
      RETURNING id`;

    const [batch] = await sql<{ id: string }[]>`
      INSERT INTO tag_batches (company_id, product_id, tag_type, quantity, label)
      VALUES (${company.id}, ${product.id}, 'standard', 10, 'Starter kit')
      RETURNING id`;
    const codes = Array.from({ length: 10 }, () => randomCode());
    // A fixed, memorable code makes local testing easy: http://localhost:3000/t/DEMO2023
    codes[0] = "DEMO2023";
    for (const code of codes) {
      await sql`INSERT INTO tags (code, batch_id, company_id, product_id) VALUES (${code}, ${batch.id}, ${company.id}, ${product.id})`;
    }

    // 90 days of fake taps with gentle growth, so every dashboard range has a sensible comparison.
    const devices = [
      ["mobile", "ios"],
      ["mobile", "ios"],
      ["mobile", "android"],
      ["tablet", "ios"],
    ];
    const cities = [
      ["US", "CA", "San Francisco"],
      ["US", "CA", "Los Angeles"],
      ["US", "CA", "Napa"],
      ["US", "NY", "New York"],
      ["US", "TX", "Austin"],
      ["US", "IL", "Chicago"],
    ];
    const rows = [];
    for (let day = 90; day >= 0; day--) {
      const trend = 4 + Math.round((90 - day) / 12);
      const count = trend + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const [deviceType, os] = devices[Math.floor(Math.random() * devices.length)];
        const [country, region, city] = cities[Math.floor(Math.random() * cities.length)];
        rows.push({
          tag_code: codes[Math.floor(Math.random() * codes.length)],
          product_id: product.id,
          company_id: company.id,
          source: Math.random() < 0.75 ? "nfc" : "qr",
          visitor_id: "v" + Math.floor(Math.random() * 400),
          device_type: deviceType,
          os,
          country,
          region,
          city,
          created_at: new Date(Date.now() - day * 86_400_000 - Math.floor(Math.random() * 86_400_000)),
        });
      }
    }
    await sql`INSERT INTO taps ${sql(rows)}`;

    // A few sample sign-ups (example.com addresses, never real people).
    const names = ["Ana", "Ben", "Chloe", "Dev", "Elena", "Frank", "Grace", "Hiro", "Isla", "Jon", "Kemi", "Liam", "Maya", "Noah"];
    const consent = DEMO_CONTENT.optin.consentText;
    for (const [i, name] of names.entries()) {
      const at = new Date(Date.now() - Math.floor(Math.random() * 60) * 86_400_000);
      await sql`
        INSERT INTO optins (product_id, company_id, email, first_name, consent_text, tag_code, visitor_id, created_at)
        VALUES (${product.id}, ${company.id}, ${`${name.toLowerCase()}${i}@example.com`}, ${name}, ${consent},
                ${codes[i % codes.length]}, ${"v" + i}, ${at})`;
    }
  }

  console.log("Seeded demo data. Try http://localhost:3000/t/DEMO2023");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
