type AuthLogLevel = "info" | "warn" | "error";

type AuthLogMeta = {
  requestId?: string;
  ip?: string;
  email?: string;
  reason?: string;
  statusCode?: number;
  durationMs?: number;
  errorName?: string;
  event?: string;
};

function maskEmail(email?: string): string | undefined {
  if (!email) {
    return undefined;
  }

  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "invalid-email";
  }

  if (local.length <= 2) {
    return `**@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

export function logAuth(level: AuthLogLevel, message: string, meta: AuthLogMeta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    requestId: meta.requestId,
    ip: meta.ip,
    email: maskEmail(meta.email),
    reason: meta.reason,
    statusCode: meta.statusCode,
    durationMs: meta.durationMs,
    errorName: meta.errorName,
    event: meta.event,
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}
