import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logAuth } from "@/lib/auth-logger";

describe("auth-logger", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  it("loguje info z maskowaniem zwykłego emaila", () => {
    logAuth("info", "auth.test", { email: "john@example.com", statusCode: 200 });

    expect(infoSpy).toHaveBeenCalledOnce();
    expect(infoSpy.mock.calls[0]?.[0]).toContain('"email":"jo***@example.com"');
  });

  it("loguje warn z maskowaniem krótkiego local part", () => {
    logAuth("warn", "auth.test", { email: "ab@example.com" });

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('"email":"**@example.com"');
  });

  it("loguje error i oznacza niepoprawny email", () => {
    logAuth("error", "auth.test", { email: "bad-email" });

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.calls[0]?.[0]).toContain('"email":"invalid-email"');
  });
});
