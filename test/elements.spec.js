import request from "supertest";
import app from "../src/app.js";

describe("Elements", () => {
  it("GET /v1/elements lista por defecto", async () => {
    const res = await request(app).get("/v1/elements").expect(200);
    expect(res.body).toHaveProperty("count");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /v1/elements soporta filtros/paginación/orden/campos", async () => {
    const res = await request(app)
      .get("/v1/elements")
      .query({
        q: "gas",
        per_page: 5,
        page: 1,
        sort: "number",
        fields: "number,symbol,name,phase",
      })
      .expect(200);

    expect(res.body.per_page).toBe(5);
    expect(res.body.page).toBe(1);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    if (res.body.data.length > 0) {
      const el = res.body.data[0];
      expect(el).toHaveProperty("number");
      expect(el).toHaveProperty("symbol");
      expect(el).toHaveProperty("name");
      expect(
        Object.keys(el).every((k) =>
          ["number", "symbol", "name", "phase"].includes(k)
        )
      ).toBe(true);
    }
  });

  it("GET /v1/elements/:id por símbolo", async () => {
    const res = await request(app).get("/v1/elements/Fe").expect(200);
    expect(res.body.symbol).toBe("Fe");
  });

  it("GET /v1/elements/:id por número", async () => {
    const res = await request(app).get("/v1/elements/8").expect(200);
    expect(res.body.number).toBe(8);
  });

  it("GET /v1/elements/:id 404 si no existe", async () => {
    await request(app).get("/v1/elements/XYZ").expect(404);
  });
});
