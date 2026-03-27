import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logAuth } from "@/lib/auth-logger";
import { validateRegisterInput } from "@/lib/auth-validation";
import { checkRateLimit } from "@/lib/auth-rate-limit";
import { checkPasswordPwned } from "@/lib/password-breach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logAuth("warn", "auth.register.invalid_json", {
        requestId,
        ip,
        event: "register",
        statusCode: 400,
      });
      return NextResponse.json(
        { message: "Nieprawidłowy format danych" },
        { status: 400 }
      );
    }

    const validation = validateRegisterInput(body);
    if (!validation.ok) {
      logAuth("warn", "auth.register.validation_failed", {
        requestId,
        ip,
        reason: validation.message,
        event: "register",
        statusCode: 400,
      });
      return NextResponse.json(
        { message: validation.message },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    const ipKey = `register:ip:${ip.split(",")[0]?.trim() ?? "unknown"}`;
    const emailKey = `register:email:${email}`;
    const ipRateLimit = checkRateLimit(ipKey, 20, 10 * 60 * 1000);
    const emailRateLimit = checkRateLimit(emailKey, 5, 10 * 60 * 1000);

    if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
      logAuth("warn", "auth.register.rate_limited", {
        requestId,
        ip,
        email,
        event: "register",
        statusCode: 429,
        reason: `retry_after_ms=${Math.max(ipRateLimit.retryAfterMs, emailRateLimit.retryAfterMs)}`,
      });
      return NextResponse.json(
        { message: "Za dużo prób. Spróbuj ponownie za kilka minut" },
        { status: 429 }
      );
    }

    const breachCheck = await checkPasswordPwned(password);
    if (breachCheck.checked && breachCheck.pwned) {
      logAuth("warn", "auth.register.weak_breached_password", {
        requestId,
        ip,
        email,
        event: "register",
        statusCode: 400,
        reason: `pwned_count=${breachCheck.count}`,
      });
      return NextResponse.json(
        { message: "To hasło pojawiło się w wyciekach danych. Wybierz inne" },
        { status: 400 }
      );
    }

    if (!breachCheck.checked) {
      logAuth("warn", "auth.register.breach_check_unavailable", {
        requestId,
        ip,
        email,
        event: "register",
        statusCode: 200,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logAuth("warn", "auth.register.user_exists", {
        requestId,
        ip,
        email,
        event: "register",
        statusCode: 409,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { message: "Użytkownik z tym emailem już istnieje" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    logAuth("info", "auth.register.success", {
      requestId,
      ip,
      email,
      event: "register",
      statusCode: 201,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Konto zostało utworzone pomyślnie",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logAuth("error", "auth.register.unexpected_error", {
      requestId,
      ip,
      event: "register",
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { message: "Błąd podczas tworzenia konta" },
      { status: 500 }
    );
  }
}
