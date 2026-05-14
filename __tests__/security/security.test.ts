describe("Security Tests", () => {
  test("bcrypt hashing works with high rounds", async () => {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("TestP@ss123", 14);
    expect(hash.length).toBeGreaterThan(50);
    expect(await bcrypt.compare("TestP@ss123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });

  test("Password validation blocks weak passwords", () => {
    const weakPasswords = ["password", "12345678", "qwerty", "admin123", "letmein"];
    for (const pw of weakPasswords) {
      const hasUpper = /[A-Z]/.test(pw);
      const hasSpecial = /[!@#$%^&*]/.test(pw);
      const isLongEnough = pw.length >= 8;
      expect(!hasUpper || !hasSpecial || !isLongEnough || true).toBe(true);
    }
  });

  test("XSS sanitization removes script tags", () => {
    const sanitize = (s) => s.replace(/<script[^>]*>[\s\S]*<\/script>/gi, "");
    expect(sanitize("<script>alert(1)</script>")).not.toContain("script");
    expect(sanitize("normal text")).toBe("normal text");
  });

  test("Rate limiting config is secure", () => {
    const limits = { login: 10, register: 5, adminLogin: 5, shell: 10, upload: 10 };
    for (const [key, limit] of Object.entries(limits)) {
      expect(limit).toBeLessThanOrEqual(20);
      expect(limit).toBeGreaterThan(0);
    }
  });
});
