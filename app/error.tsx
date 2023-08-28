"use client";

import { ApiError } from "@/lib/utils";
import { RedirectType } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  // If the error is a forbidden because the user isn't logged in, redirect to the login page.
  if (error instanceof ApiError && error.cause?.status === 401) {
    redirect("/login", RedirectType.push);
  }

  return (
    <div>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}