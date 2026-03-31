import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { logActivity } from "@/lib/activity";
import {
  createVerificationToken,
  deleteVerificationTokenByToken,
  findVerificationTokenByToken,
} from "@/repositories/auth/verification-token.repository";
import {
  createRegisteredUser,
  findUserAuthCandidateByEmail,
  findUserByEmail,
  updateUserProfileById,
  updateUserPasswordByEmail,
  verifyUserEmailByEmail,
} from "@/repositories/users/user.repository";
import { sendPasswordResetEmail } from "@/services/email/password-reset.email";
import { sendVerificationEmail } from "@/services/email/verify-email.email";

const PASSWORD_HASH_ROUNDS = 12;
const PASSWORD_RESET_TOKEN_PREFIX = "password-reset:";
const EMAIL_VERIFICATION_TOKEN_PREFIX = "verify-email:";
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function issueToken(input: {
  prefix: string;
  email: string;
  expiresInMs: number;
}): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");

  await createVerificationToken({
    identifier: `${input.prefix}${input.email}`,
    token: hashToken(rawToken),
    expires: new Date(Date.now() + input.expiresInMs),
  });

  return rawToken;
}

function getTokenEmail(identifier: string, prefix: string): string | null {
  if (!identifier.startsWith(prefix)) {
    return null;
  }

  const email = identifier.slice(prefix.length).trim().toLowerCase();
  return email.length > 0 ? email : null;
}

export async function updateOwnUserProfile(input: {
  userId: string;
  name?: unknown;
  email?: unknown;
}) {
  const updates: { name?: string | null; email?: string | null } = {};

  if (typeof input.name === "string") {
    updates.name = input.name.trim().slice(0, 120);
  }

  if (typeof input.email === "string") {
    const trimmed = input.email.trim();
    updates.email = trimmed.length > 0 ? trimmed.slice(0, 190) : null;
  }

  if (!Object.keys(updates).length) {
    return { error: "No valid fields to update" as const, status: 400 as const };
  }

  const data = await updateUserProfileById({
    userId: input.userId,
    ...updates,
  });

  return { data };
}

export async function registerCredentialUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return {
      error: "An account with that email already exists." as const,
      status: 409 as const,
    };
  }

  const hashedPassword = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

  const user = await createRegisteredUser({
    name: input.name,
    email,
    hashedPassword,
  });

  void issueToken({
    prefix: EMAIL_VERIFICATION_TOKEN_PREFIX,
    email,
    expiresInMs: EMAIL_VERIFICATION_EXPIRY_MS,
  })
    .then((token) =>
      sendVerificationEmail({
        email,
        userName: user.name ?? null,
        token,
      }),
    )
    .catch((error) => {
      console.error("[AUTH] Failed to queue verification email:", error);
    });

  void logActivity({
    userId: user.id,
    action: "USER_SIGNUP",
    entity: "User",
    entityId: user.id,
    metadata: { email },
  }).catch(() => {});

  return { data: user };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserAuthCandidateByEmail(normalizedEmail);

  if (!user?.email || !user.hashedPassword) {
    return;
  }

  const token = await issueToken({
    prefix: PASSWORD_RESET_TOKEN_PREFIX,
    email: normalizedEmail,
    expiresInMs: PASSWORD_RESET_EXPIRY_MS,
  });

  await sendPasswordResetEmail({
    email: user.email,
    userName: user.name ?? null,
    token,
  });
}

export async function confirmPasswordReset(input: {
  token: string;
  password: string;
}) {
  const storedToken = await findVerificationTokenByToken(hashToken(input.token));

  if (!storedToken) {
    return {
      error: "Invalid or expired reset link." as const,
      status: 400 as const,
    };
  }

  if (storedToken.expires.getTime() <= Date.now()) {
    await deleteVerificationTokenByToken(storedToken.token);
    return {
      error: "Invalid or expired reset link." as const,
      status: 400 as const,
    };
  }

  const email = getTokenEmail(storedToken.identifier, PASSWORD_RESET_TOKEN_PREFIX);
  if (!email) {
    await deleteVerificationTokenByToken(storedToken.token);
    return {
      error: "Invalid or expired reset link." as const,
      status: 400 as const,
    };
  }

  const user = await findUserAuthCandidateByEmail(email);
  if (!user?.email || !user.hashedPassword) {
    await deleteVerificationTokenByToken(storedToken.token);
    return {
      error: "Invalid or expired reset link." as const,
      status: 400 as const,
    };
  }

  const hashedPassword = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

  await updateUserPasswordByEmail(email, hashedPassword);
  await deleteVerificationTokenByToken(storedToken.token);

  return { data: { email } };
}

export async function confirmEmailVerification(token: string) {
  const storedToken = await findVerificationTokenByToken(hashToken(token));

  if (!storedToken) {
    return {
      error: "Invalid or expired verification link." as const,
      status: 400 as const,
    };
  }

  if (storedToken.expires.getTime() <= Date.now()) {
    await deleteVerificationTokenByToken(storedToken.token);
    return {
      error: "Invalid or expired verification link." as const,
      status: 400 as const,
    };
  }

  const email = getTokenEmail(storedToken.identifier, EMAIL_VERIFICATION_TOKEN_PREFIX);
  if (!email) {
    await deleteVerificationTokenByToken(storedToken.token);
    return {
      error: "Invalid or expired verification link." as const,
      status: 400 as const,
    };
  }

  const user = await findUserAuthCandidateByEmail(email);
  if (!user?.email) {
    await deleteVerificationTokenByToken(storedToken.token);
    return {
      error: "Invalid or expired verification link." as const,
      status: 400 as const,
    };
  }

  await verifyUserEmailByEmail(email);
  await deleteVerificationTokenByToken(storedToken.token);

  return { data: { email } };
}
