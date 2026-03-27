import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkPasswordPwned } from "@/lib/password-breach";

function sha1Upper(value: string) {
  return createHash("sha1").update(value, "utf8").digest("hex").toUpperCase();
}

describe("password-breach", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("zwraca pwned=true gdy suffix występuje w odpowiedzi", async () => {
    const password = "password1234";
    const hash = sha1Upper(password);
    const suffix = hash.slice(5);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `${suffix}:42\nOTHERHASH:1`,
    }) as typeof fetch;

    await expect(checkPasswordPwned(password)).resolves.toEqual({
      checked: true,
      pwned: true,
      count: 42,
    });
  });

  it("zwraca pwned=false gdy hasła nie ma w odpowiedzi", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `OTHERHASH:1`,
    }) as typeof fetch;

    await expect(checkPasswordPwned("password1234")).resolves.toEqual({
      checked: true,
      pwned: false,
      count: 0,
    });
  });

  it("zwraca checked=false gdy upstream odpowiada błędem", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "",
    }) as typeof fetch;

    await expect(checkPasswordPwned("password1234")).resolves.toEqual({
      checked: false,
      pwned: false,
      count: 0,
    });
  });

  it("zwraca checked=false gdy fetch rzuca wyjątek", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as typeof fetch;

    await expect(checkPasswordPwned("password1234")).resolves.toEqual({
      checked: false,
      pwned: false,
      count: 0,
    });
  });
});
