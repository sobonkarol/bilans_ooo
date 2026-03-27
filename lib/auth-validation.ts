const EMAIL_MAX_LENGTH = 254;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const PASSWORD_MIN_LENGTH = 8;
// bcrypt compares only first 72 bytes; explicit cap avoids confusing behavior.
const PASSWORD_MAX_LENGTH = 72;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const commonWeakPasswords = new Set([
  "password",
  "password123",
  "12345678",
  "qwerty123",
  "letmein",
  "admin123",
  "zaq12wsx",
]);

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function validateEmail(email: string): ValidationResult<string> {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return { ok: false, message: "Email jest wymagany" };
  }

  if (normalized.length > EMAIL_MAX_LENGTH) {
    return { ok: false, message: "Email jest za długi" };
  }

  if (!emailRegex.test(normalized)) {
    return { ok: false, message: "Nieprawidłowy format email" };
  }

  return { ok: true, data: normalized };
}

function validatePassword(password: string, email?: string): ValidationResult<string> {
  if (!password) {
    return { ok: false, message: "Hasło jest wymagane" };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: "Hasło musi mieć co najmniej 8 znaków" };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, message: "Hasło jest za długie" };
  }

  const normalizedForList = password.toLowerCase().trim();
  if (commonWeakPasswords.has(normalizedForList)) {
    return { ok: false, message: "Hasło jest zbyt słabe" };
  }

  if (email) {
    const localPart = normalizeEmail(email).split("@")[0] ?? "";
    if (localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
      return { ok: false, message: "Hasło nie może zawierać nazwy użytkownika" };
    }
  }

  return { ok: true, data: password };
}

function validateName(name: string): ValidationResult<string> {
  const normalized = normalizeName(name);

  if (!normalized) {
    return { ok: false, message: "Imię i nazwisko jest wymagane" };
  }

  if (normalized.length < NAME_MIN_LENGTH) {
    return { ok: false, message: "Imię i nazwisko jest za krótkie" };
  }

  if (normalized.length > NAME_MAX_LENGTH) {
    return { ok: false, message: "Imię i nazwisko jest za długie" };
  }

  return { ok: true, data: normalized };
}

export function validateLoginInput(raw: unknown): ValidationResult<LoginInput> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Nieprawidłowe dane logowania" };
  }

  const input = raw as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";

  const emailResult = validateEmail(email);
  if (!emailResult.ok) {
    return emailResult;
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.ok) {
    return passwordResult;
  }

  return {
    ok: true,
    data: {
      email: emailResult.data,
      password: passwordResult.data,
    },
  };
}

export function validateRegisterInput(raw: unknown): ValidationResult<RegisterInput> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Nieprawidłowe dane rejestracji" };
  }

  const input = raw as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name : "";

  const emailResult = validateEmail(email);
  if (!emailResult.ok) {
    return emailResult;
  }

  const nameResult = validateName(name);
  if (!nameResult.ok) {
    return nameResult;
  }

  const passwordResult = validatePassword(password, emailResult.data);
  if (!passwordResult.ok) {
    return passwordResult;
  }

  return {
    ok: true,
    data: {
      email: emailResult.data,
      name: nameResult.data,
      password: passwordResult.data,
    },
  };
}

export function getAuthPasswordLimits() {
  return {
    min: PASSWORD_MIN_LENGTH,
    max: PASSWORD_MAX_LENGTH,
  };
}
