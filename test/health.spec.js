import request from "supertest";
import app from "../src/app.js";

describe("Health", () => {
  it("GET /health devuelve ok", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});
