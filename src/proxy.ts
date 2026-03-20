// i18n removed. next-intl previously used this file as an edge-middleware
// proxy. It is no longer referenced by anything, but Next.js expects proxy
// files to export a callable function when the file exists.
import { NextResponse } from "next/server";

export default function proxy() {
  return NextResponse.next();
}
