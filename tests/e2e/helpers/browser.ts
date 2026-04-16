import type { Page } from "@playwright/test";

const IGNORABLE_DEV_CONSOLE_ERRORS = [
  /_next\/webpack-hmr/i,
  /ERR_INVALID_HTTP_RESPONSE/i,
  /\[next-auth\]\[error\]\[CLIENT_FETCH_ERROR\][\s\S]*\/api\/auth\/session[\s\S]*Failed to fetch/i,
];

export function isIgnorableConsoleError(message: string) {
  return IGNORABLE_DEV_CONSOLE_ERRORS.some((pattern) => pattern.test(message));
}

export function collectRuntimeErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    const stack = typeof error.stack === "string" ? error.stack.trim() : "";
    pageErrors.push(stack.length > 0 ? stack : String(error));
  });

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !isIgnorableConsoleError(message.text())
    ) {
      consoleErrors.push(message.text());
    }
  });

  return { pageErrors, consoleErrors };
}
