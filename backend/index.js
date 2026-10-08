import app from "./src/app.js";
import { config } from "./src/config.js";

// Vercel's zero-config Express runtime imports this file and mounts the
// default export — never call listen() there.
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`email-verification API listening on http://localhost:${config.port}`);
  });
}

export default app;
