
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding TLD Pricing...");

  const tlds = [
    { tld: ".com", registerPrice: 12.99, renewPrice: 14.99, transferPrice: 10.99, category: "popular", isFree: false },
    { tld: ".net", registerPrice: 11.99, renewPrice: 13.99, transferPrice: 9.99, category: "popular", isFree: false },
    { tld: ".org", registerPrice: 10.99, renewPrice: 12.99, transferPrice: 9.99, category: "popular", isFree: false },
    { tld: ".io", registerPrice: 39.99, renewPrice: 39.99, transferPrice: 35.99, category: "popular", isFree: false },
    { tld: ".co", registerPrice: 29.99, renewPrice: 29.99, transferPrice: 24.99, category: "popular", isFree: false },
    { tld: ".dev", registerPrice: 14.99, renewPrice: 14.99, transferPrice: 12.99, category: "popular", isFree: false },
    { tld: ".app", registerPrice: 14.99, renewPrice: 14.99, transferPrice: 12.99, category: "popular", isFree: false },
    { tld: ".me", registerPrice: 8.99, renewPrice: 19.99, transferPrice: 7.99, category: "popular", promo: true, promoPrice: 3.99, isFree: false },
    { tld: ".bd", registerPrice: 15.99, renewPrice: 15.99, transferPrice: 12.99, category: "country", isFree: false },
    { tld: ".com.bd", registerPrice: 19.99, renewPrice: 19.99, transferPrice: 15.99, category: "country", isFree: false },
    { tld: ".uk", registerPrice: 9.99, renewPrice: 9.99, transferPrice: 7.99, category: "country", isFree: false },
    { tld: ".us", registerPrice: 8.99, renewPrice: 10.99, transferPrice: 7.99, category: "country", isFree: false },
    { tld: ".in", registerPrice: 9.99, renewPrice: 11.99, transferPrice: 8.99, category: "country", isFree: false },
    { tld: ".pk", registerPrice: 24.99, renewPrice: 24.99, transferPrice: 19.99, category: "country", isFree: false },
    { tld: ".xyz", registerPrice: 1.99, renewPrice: 12.99, transferPrice: 8.99, category: "tech", promo: true, promoPrice: 0.99, isFree: false },
    { tld: ".tech", registerPrice: 49.99, renewPrice: 49.99, transferPrice: 39.99, category: "tech", promo: true, promoPrice: 2.99, isFree: false },
    { tld: ".cloud", registerPrice: 19.99, renewPrice: 19.99, transferPrice: 16.99, category: "tech", isFree: false },
    { tld: ".ai", registerPrice: 69.99, renewPrice: 69.99, transferPrice: 59.99, category: "tech", isFree: false },
    { tld: ".code", registerPrice: 24.99, renewPrice: 24.99, transferPrice: 19.99, category: "tech", isFree: false },
    { tld: ".sh", registerPrice: 49.99, renewPrice: 49.99, transferPrice: 39.99, category: "tech", isFree: false },
    { tld: ".run", registerPrice: 19.99, renewPrice: 19.99, transferPrice: 16.99, category: "tech", isFree: false },
    { tld: ".store", registerPrice: 3.99, renewPrice: 39.99, transferPrice: 29.99, category: "business", promo: true, promoPrice: 0.99, isFree: false },
    { tld: ".shop", registerPrice: 9.99, renewPrice: 39.99, transferPrice: 29.99, category: "business", isFree: false },
    { tld: ".online", registerPrice: 3.99, renewPrice: 39.99, transferPrice: 29.99, category: "business", promo: true, promoPrice: 0.99, isFree: false },
    { tld: ".site", registerPrice: 3.99, renewPrice: 34.99, transferPrice: 24.99, category: "business", promo: true, promoPrice: 1.99, isFree: false },
    { tld: ".website", registerPrice: 3.99, renewPrice: 24.99, transferPrice: 19.99, category: "business", promo: true, promoPrice: 1.99, isFree: false },
    { tld: ".info", registerPrice: 4.99, renewPrice: 19.99, transferPrice: 14.99, category: "popular", isFree: false },
    { tld: ".biz", registerPrice: 9.99, renewPrice: 19.99, transferPrice: 14.99, category: "business", isFree: false },
    { tld: "fahadcloud.com", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
    { tld: ".tk", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
    { tld: ".ml", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
    { tld: ".ga", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
    { tld: ".cf", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
    { tld: ".eu.org", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
    { tld: ".pp.ua", registerPrice: 0, renewPrice: 0, transferPrice: 0, category: "free", isFree: true },
  ];

  for (const tld of tlds) {
    try {
      await prisma.tldPricing.upsert({
        where: { tld: tld.tld },
        update: tld,
        create: tld,
      });
      console.log("Added:", tld.tld);
    } catch (e) {
      console.log("Skip:", tld.tld, e.message);
    }
  }

  console.log("Seeding Hosting Plans...");

  const plans = [
    {
      name: "Starter",
      slug: "starter",
      price: 2.99,
      yearlyPrice: 29.99,
      storage: "1 GB",
      bandwidth: "10 GB",
      websites: 1,
      support: "Community",
      features: JSON.stringify(["1 Website", "1 GB SSD Storage", "10 GB Bandwidth", "Free SSL Certificate", "Community Support", "1 Database", "Daily Backups"]),
      popular: false,
      category: "shared",
    },
    {
      name: "Professional",
      slug: "professional",
      price: 5.99,
      yearlyPrice: 59.99,
      storage: "10 GB",
      bandwidth: "100 GB",
      websites: 5,
      support: "Priority Email",
      features: JSON.stringify(["5 Websites", "10 GB SSD Storage", "100 GB Bandwidth", "Free SSL Certificate", "Priority Email Support", "5 Databases", "Daily Backups", "DNS Management", "1-Click Deploy"]),
      popular: true,
      category: "shared",
    },
    {
      name: "Business",
      slug: "business",
      price: 12.99,
      yearlyPrice: 129.99,
      storage: "50 GB",
      bandwidth: "Unlimited",
      websites: 25,
      support: "24/7 Live Chat",
      features: JSON.stringify(["25 Websites", "50 GB SSD Storage", "Unlimited Bandwidth", "Free SSL Certificate", "24/7 Live Chat Support", "Unlimited Databases", "Hourly Backups", "DNS Management", "1-Click Deploy", "SSH Access", "Staging Environment"]),
      popular: false,
      category: "shared",
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      price: 29.99,
      yearlyPrice: 299.99,
      storage: "200 GB",
      bandwidth: "Unlimited",
      websites: -1,
      support: "Dedicated Manager",
      features: JSON.stringify(["Unlimited Websites", "200 GB NVMe Storage", "Unlimited Bandwidth", "Free SSL Certificate", "Dedicated Account Manager", "Unlimited Databases", "Real-time Backups", "DNS Management", "1-Click Deploy", "SSH/Root Access", "Staging Environment", "Custom Firewall", "DDoS Protection", "Priority Deployment"]),
      popular: false,
      category: "shared",
    },
  ];

  for (const plan of plans) {
    try {
      await prisma.hostingPlan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
      });
      console.log("Added plan:", plan.slug);
    } catch (e) {
      console.log("Skip plan:", plan.slug, e.message);
    }
  }

  console.log("Updating admin user...");
  try {
    await prisma.user.update({
      where: { email: "admin@fahadcloud.com" },
      data: { emailVerified: true },
    });
    console.log("Admin emailVerified set to true");
  } catch (e) {
    console.log("Admin update error:", e.message);
  }

  console.log("Setting configs...");
  try {
    await prisma.agentSystemConfig.upsert({
      where: { key: "registration_enabled" },
      update: { value: "true" },
      create: { key: "registration_enabled", value: "true", description: "Enable/disable new user registration" },
    });
    console.log("Registration enabled");
  } catch (e) {
    console.log("Config error:", e.message);
  }

  const tldCount = await prisma.tldPricing.count();
  const planCount = await prisma.hostingPlan.count();
  const userCount = await prisma.user.count();
  console.log("=== SEED COMPLETE ===");
  console.log("TLDs:", tldCount);
  console.log("Plans:", planCount);
  console.log("Users:", userCount);
}

seed().catch(e => console.error("SEED ERROR:", e));
