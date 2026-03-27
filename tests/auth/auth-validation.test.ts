import { describe, expect, it } from "vitest";

import {
  getAuthPasswordLimits,
  normalizeEmail,
  normalizeName,
  validateLoginInput,
  validateRegisterInput,
} from "@/lib/auth-validation";

describe("auth-validation", () => {
  it("normalizuje email i nazwę", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
    expect(normalizeName("  Jan   Kowalski  ")).toBe("Jan Kowalski");
  });

  it("odrzuca nieprawidłowe dane logowania", () => {
    expect(validateLoginInput(null)).toEqual({ ok: false, message: "Nieprawidłowe dane logowania" });
    expect(validateLoginInput({ email: "", password: "password1234" })).toEqual({
      ok: false,
      message: "Email jest wymagany",
    });
    expect(validateLoginInput({ email: "bad-email", password: "password1234" })).toEqual({
      ok: false,
      message: "Nieprawidłowy format email",
    });
    expect(validateLoginInput({ email: "john@example.com", password: "123" })).toEqual({
      ok: false,
      message: "Hasło musi mieć co najmniej 8 znaków",
    });
  });

  it("odrzuca słabe lub nieprawidłowe hasła w rejestracji", () => {
    expect(
      validateRegisterInput({
        email: "john@example.com",
        password: "password123",
        name: "John",
      })
    ).toEqual({ ok: false, message: "Hasło jest zbyt słabe" });

    expect(
      validateRegisterInput({
        email: "john@example.com",
        password: "john-super-pass",
        name: "John",
      })
    ).toEqual({ ok: false, message: "Hasło nie może zawierać nazwy użytkownika" });

    expect(
      validateRegisterInput({
        email: "john@example.com",
        password: "a".repeat(getAuthPasswordLimits().max + 1),
        name: "John",
      })
    ).toEqual({ ok: false, message: "Hasło jest za długie" });
  });

  it("odrzuca nieprawidłowe dane rejestracji", () => {
    expect(validateRegisterInput(null)).toEqual({ ok: false, message: "Nieprawidłowe dane rejestracji" });
    expect(
      validateRegisterInput({
        email: "john@example.com",
        password: "password1234",
        name: " ",
      })
    ).toEqual({ ok: false, message: "Imię i nazwisko jest wymagane" });
    expect(
      validateRegisterInput({
        email: "john@example.com",
        password: "password1234",
        name: "J",
      })
    ).toEqual({ ok: false, message: "Imię i nazwisko jest za krótkie" });
  });

  it("zwraca poprawnie znormalizowane dane dla poprawnej rejestracji", () => {
    expect(
      validateRegisterInput({
        email: "  JOHN@Example.com ",
        password: "password1234",
        name: "  John   Kowalski ",
      })
    ).toEqual({
      ok: true,
      data: {
        email: "john@example.com",
        password: "password1234",
        name: "John Kowalski",
      },
    });
  });
});
