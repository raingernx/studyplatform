import { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  type AppUserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      subscriptionStatus?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppUserRole;
    subscriptionStatus?: string;
  }
}

declare module "next-auth/jwt" {
  type AppUserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

  interface JWT {
    id?: string;
    role?: AppUserRole;
    subscriptionStatus?: string;
  }
}

