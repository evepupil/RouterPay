import { createEasyPaySign } from "./auth";
import { describe, expect, it } from "vitest";

describe("EasyPay signing", () => {
  it("sorts params and excludes sign fields", async () => {
    const sign = await createEasyPaySign(
      {
        pid: "m_default",
        type: "alipay",
        out_trade_no: "E1",
        name: "Test",
        money: "1.00",
        sign: "ignored",
        sign_type: "MD5"
      },
      "easypay_dev_key"
    );

    expect(sign).toMatch(/^[a-f0-9]{32}$/);
    expect(sign).toBe(
      await createEasyPaySign(
        {
          money: "1.00",
          name: "Test",
          out_trade_no: "E1",
          pid: "m_default",
          type: "alipay"
        },
        "easypay_dev_key"
      )
    );
  });
});
