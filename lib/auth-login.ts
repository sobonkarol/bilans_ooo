import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAuth } from "@/lib/auth-logger";
import { validateLoginInput } from "@/lib/auth-validation";
import { checkRateLimit } from "@/lib/auth-rate-limit";

const DUMMY_HASH = "$2a$12$5f5v4h4G2uIY8p3r2Q7squ3y4I6lqjQbgR8g9Q3sK6hJz6pYBML8S";

type HeaderValue = string | string[] | undefined;

type AuthHeaders = Record<string, HeaderValue> | undefined;

function getClientIp(headers: AuthHeaders): string {
  const forwarded = headers?.["x-forwarded-for"];
  const realIp = headers?.["x-real-ip"];

  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim() ?? "unknown";
  }

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  if (Array.isArray(realIp) && realIp[0]) {
    return realIp[0].trim();
  }

  if (typeof realIp === "string") {
    return realIp.trim();
  }

  return "unknown";
}

export async function authorizeCredentials(credentials: unknown, headers?: AuthHeaders) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  const validation = validateLoginInput(credentials);
  if (!validation.ok) {
    logAuth("warn", "auth.login.validation_failed", {
      requestId,
      reason: validation.message,
      event: "login",
      statusCode: 400,
    });
    return null;
  }

  const { email, password } = validation.data;
  const ipFromHeader = getClientIp(headers);

  const rateLimit = checkRateLimit(`login:${email}`, 10, 5 * 60 * 1000);
  const ipRateLimit = checkRateLimit(`login:ip:${ipFromHeader}`, 30, 5 * 60 * 1000);

  if (!rateLimit.allowed || !ipRateLimit.allowed) {
    logAuth("warn", "auth.login.rate_limited", {
      requestId,
      ip: ipFromHeader,
      email,
      event: "login",
      statusCode: 429,
      reason: `retry_after_ms=${Math.max(rateLimit.retryAfterMs, ipRateLimit.retryAfterMs)}`,
    });
    throw new Error("TOO_MANY_ATTEMPTS");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const hashToCompare = user?.password ?? DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !user.password || !isPasswordValid) {
      logAuth("warn", "auth.login.invalid_credentials", {
        requestId,
        email,
        event: "login",
        statusCode: 401,
        durationMs: Date.now() - startedAt,
      });
      return null;
    }

    logAuth("info", "auth.login.success", {
      requestId,
      email,
      event: "login",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };
  } catch (error) {
    logAuth("error", "auth.login.unexpected_error", {
      requestId,
      email,
      event: "login",
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return null;
  }
}
