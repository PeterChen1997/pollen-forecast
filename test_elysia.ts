import { Elysia } from "elysia";
const app = new Elysia().get("/", () => "hi").listen({ port: 3001, hostname: "0.0.0.0" });
console.log(app.server?.hostname);
