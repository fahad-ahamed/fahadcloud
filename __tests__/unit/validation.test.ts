import { validateEmail, validatePassword, validateDomainName, validateRequired, sanitizeString } from "@/lib/middleware/validation.middleware";

describe("Validation Middleware", () => {
  test("validateEmail accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.name@domain.co")).toBe(true);
  });

  test("validateEmail rejects invalid emails", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("notanemail")).toBe(false);
  });

  test("validatePassword accepts strong passwords", () => {
    const result = validatePassword("StrongP@ss123");
    expect(result.valid).toBe(true);
  });

  test("validatePassword rejects short passwords", () => {
    expect(validatePassword("Ab1!").valid).toBe(false);
  });

  test("validatePassword rejects common passwords", () => {
    expect(validatePassword("password").valid).toBe(false);
  });

  test("validateDomainName accepts valid domains", () => {
    expect(validateDomainName("example.com").valid).toBe(true);
  });

  test("validateDomainName rejects invalid domains", () => {
    expect(validateDomainName("").valid).toBe(false);
  });

  test("validateRequired validates fields", () => {
    expect(validateRequired({ email: "t@t.com" }, ["email"]).valid).toBe(true);
    expect(validateRequired({}, ["email"]).valid).toBe(false);
  });

  test("sanitizeString removes dangerous chars", () => {
    expect(sanitizeString("<script>alert(1)</script>")).not.toContain("<script>");
  });
});
