jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, opts) => ({ status: opts?.status || 200, json: () => Promise.resolve(body) }),
  },
}));

import { apiSuccess, apiError, apiPaginated, apiCreated, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-response";

describe("API Response Helpers", () => {
  test("apiSuccess returns 200", () => { expect(apiSuccess({ id: "1" }).status).toBe(200); });
  test("apiError returns 400", () => { expect(apiError("fail", 400).status).toBe(400); });
  test("apiError returns 500", () => { expect(apiError("server error", 500).status).toBe(500); });
  test("apiCreated returns 201", () => { expect(apiCreated({}).status).toBe(201); });
  test("apiUnauthorized returns 401", () => { expect(apiUnauthorized().status).toBe(401); });
  test("apiForbidden returns 403", () => { expect(apiForbidden().status).toBe(403); });
  test("apiNotFound returns 404", () => { expect(apiNotFound().status).toBe(404); });
  test("apiPaginated returns 200", () => { expect(apiPaginated(["a"], 1, 10, 25).status).toBe(200); });
});
