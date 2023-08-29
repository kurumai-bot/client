"use client";

import { FormEvent, useState } from "react";
import { Client } from "@/lib/api/client";
import { RedirectType } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";

export default function Login() {
  const [shouldRedirect, setShouldRedirect] = useState(false);

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();

    const elements = (ev.target as HTMLFormElement).elements;

    const username = (elements.namedItem("username") as RadioNodeList).value;
    const password = (elements.namedItem("password") as RadioNodeList).value;

    Client.authenticate({ username: username, password: password }).then(() => {
      setShouldRedirect(true);
    });
  }

  // redirect can't be used in callbacks, only during render, so a workaround like this is needed.
  if (shouldRedirect) {
    redirect("/", RedirectType.push);
  }

  return (
    <div>
      <h1 className="mb-3 text-3xl text-center">
        Login
      </h1>
      <form className="flex flex-col" onSubmit={onSubmit}>
        <label className="float-left">
          Username
        </label>
        <input type="text" name="username" className="mb-2" />
        <label>
          Password
        </label>
        <input type="password" name="password" className="mb-4" />
        <input type="submit" className="bg-[color:rgb(var(--accent-rgb))]" />
      </form>
    </div>
  );
}