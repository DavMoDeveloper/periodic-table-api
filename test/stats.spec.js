import request from "supertest";
import app from "../src/app.js";

describe("Stats", () => {
  it("GET /v1/stats devuelve totales y claves", async () => {
    const res = await request(app).get("/v1/stats").expect(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("byGroup");
    expect(res.body).toHaveProperty("byPeriod");
    expect(res.body).toHaveProperty("byCategory");
    expect(res.body).toHaveProperty("byPhase");
  });
});
