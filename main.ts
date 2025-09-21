import { createApp } from "./src/app.ts";

const main = async () => {
  const app = await createApp();
  Deno.serve(app.fetch);
};

main();
