import { createHash } from "crypto";

export type PasswordBreachCheckResult = {
  checked: boolean;
  pwned: boolean;
  count: number;
};

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const REQUEST_TIMEOUT_MS = 2000;

function sha1Upper(value: string): string {
  return createHash("sha1").update(value, "utf8").digest("hex").toUpperCase();
}

export async function checkPasswordPwned(password: string): Promise<PasswordBreachCheckResult> {
  const hash = sha1Upper(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return { checked: false, pwned: false, count: 0 };
    }

    const body = await response.text();
    const lines = body.split("\n");

    for (const line of lines) {
      const [hashSuffix, countRaw] = line.trim().split(":");
      if (!hashSuffix || !countRaw) {
        continue;
      }

      if (hashSuffix.toUpperCase() === suffix) {
        const count = Number.parseInt(countRaw, 10);
        return {
          checked: true,
          pwned: Number.isFinite(count) && count > 0,
          count: Number.isFinite(count) ? count : 1,
        };
      }
    }

    return { checked: true, pwned: false, count: 0 };
  } catch {
    return { checked: false, pwned: false, count: 0 };
  } finally {
    clearTimeout(timeout);
  }
}
