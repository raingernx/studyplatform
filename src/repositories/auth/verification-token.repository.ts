import { prisma } from "@/lib/prisma";

export function createVerificationToken(input: {
  identifier: string;
  token: string;
  expires: Date;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({
      where: { identifier: input.identifier },
    });

    return tx.verificationToken.create({
      data: {
        identifier: input.identifier,
        token: input.token,
        expires: input.expires,
      },
    });
  });
}

export function findVerificationTokenByToken(token: string) {
  return prisma.verificationToken.findUnique({
    where: { token },
  });
}

export function deleteVerificationTokenByToken(token: string) {
  return prisma.verificationToken.deleteMany({
    where: { token },
  });
}

export function deleteVerificationTokensByIdentifier(identifier: string) {
  return prisma.verificationToken.deleteMany({
    where: { identifier },
  });
}
