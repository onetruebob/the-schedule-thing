import { ActionFunction, json } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { createUserSession, login } from "~/utils/session.server";

const badRequest = () => json({}, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  if (typeof username !== "string" || typeof password !== "string") {
    return badRequest();
  }

  const user = await login({ username, password });
  if (!user) {
    return badRequest();
  }
  return createUserSession(user.id, "/");
};

export default function LoginPage() {
  return (
    <Form method="post">
      <p>
        <label>
          Username: <input name="username" type="text" />
        </label>
      </p>
      <p>
        <label>
          Password: <input name="password" type="password" />
        </label>
      </p>
      <button type="submit">Login</button>
    </Form>
  );
}
