import { createTestDb } from "@/test/d1";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import webhookApp from "./webhook";

describe("provider webhook route", () => {
  it("acknowledges unmatched Afdian test webhooks with an Afdian success JSON response", async () => {
    const testDb = await createTestDb();
    const app = new Hono();
    app.route("/api/v1/providers/:provider/webhook", webhookApp);
    const response = await app.request(
      "/api/v1/providers/afdian/webhook",
      {
        method: "POST",
        body: JSON.stringify({
          ec: 200,
          em: "ok",
          data: {
            type: "order",
            order: {
              out_trade_no: "202106232138371083454010626",
              user_id: "adf397fe8374811eaacee52540025c377",
              plan_id: "a45353328af911eb973052540025c377",
              month: 1,
              total_amount: "5.00",
              show_amount: "5.00",
              status: 2,
              remark: "",
              redeem_id: "",
              product_type: 0,
              discount: "0.00",
              sku_detail: [],
              address_person: "",
              address_phone: "",
              address_address: ""
            }
          }
        })
      },
      {
        DB: testDb.d1
      }
    );

    await expect(response.json()).resolves.toEqual({ ec: 200, em: "" });
    expect(response.status).toBe(200);
  });
});
