import { Elysia } from "elysia";
import { staticPlugin } from '@elysiajs/static';
import path from "path";

const staticDir = path.join(__dirname, 'frontend/dist');
console.log("staticDir:", staticDir);

const app = new Elysia()
  .use(staticPlugin({
    assets: 'frontend/dist',
    prefix: '/'
  }))
  .get("/*", ({ request }) => {
      const url = new URL(request.url);
      console.log("Caught by catch-all:", url.pathname);
      return "Catch all response";
  })
  .listen(3002);

console.log("listening on 3002");
