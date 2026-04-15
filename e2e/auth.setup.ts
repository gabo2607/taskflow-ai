import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

setup("authenticate via Supabase API", async ({ page, request }) => {
  if (!SUPABASE_URL || !ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD"
    );
  }

  // Exchange credentials for a session directly via the Supabase Auth API,
  // bypassing the login form so setup is fast and not coupled to UI changes.
  const response = await request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      headers: {
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok()) {
    throw new Error(`Supabase auth failed (${response.status()}): ${await response.text()}`);
  }

  const session = await response.json();

  // Navigate to app root to initialise the browser context (sets origin)
  await page.goto("/");

  // Set the cookie that @supabase/ssr reads on every SSR request.
  // The project ref is the subdomain portion of the Supabase URL.
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  await page.context().addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: encodeURIComponent(JSON.stringify(session)),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Verify the session cookie is accepted by the app
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");

  await page.context().storageState({ path: STORAGE_STATE });
});
