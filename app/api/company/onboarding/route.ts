import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateCompanyOnboardingInput } from "@/lib/company-onboarding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = randomUUID();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Brak autoryzacji" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Nieprawidłowy format danych" }, { status: 400 });
    }

    const validation = validateCompanyOnboardingInput(body);
    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const company = await prisma.company.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validation.data,
        onboardingCompleted: true,
      },
      update: {
        ...validation.data,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        userId: true,
        onboardingCompleted: true,
        rateType: true,
        rateValue: true,
        workingHoursPerDay: true,
        taxType: true,
        zusType: true,
      },
    });

    return NextResponse.json(
      {
        requestId,
        message: "Ustawienia firmy zostały zapisane",
        company,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        requestId,
        message: "Nie udało się zapisać ustawień firmy",
      },
      { status: 500 }
    );
  }
}
