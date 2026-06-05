import { test as setup } from "@playwright/test";
import { cleanupDemoArtifacts } from "../helpers/api.js";

setup("очистка мусора от прошлых E2E-прогонов", async ({ request }) => {
  await cleanupDemoArtifacts(request);
});
