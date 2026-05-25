import type {
  CallbackPayload,
  CreatePaymentInput,
  CreatePaymentResult,
  HttpRequestInput,
  InboundProtocolAdapter
} from "../types";
import { easypayCreatePaymentSchema } from "./schema";

export const easypayProtocolAdapter: InboundProtocolAdapter = {
  name: "easypay",
  async parseCreatePayment(input: HttpRequestInput): Promise<CreatePaymentInput> {
    const body = easypayCreatePaymentSchema.parse(input.body);

    return {
      merchantId: body.pid,
      merchantOrderId: body.out_trade_no,
      inboundProtocol: "easypay",
      amountMinor: decimalMoneyToMinor(body.money),
      currency: "CNY",
      orderName: body.name,
      notifyUrl: body.notify_url,
      returnUrl: body.return_url,
      metadata: {
        easypayType: body.type,
        sitename: body.sitename ?? ""
      }
    };
  },
  formatCreatePaymentResult(result: CreatePaymentResult): Response {
    return Response.json({
      code: 1,
      trade_no: result.routerpayOrderId,
      payurl: result.paymentUrl,
      payment_code: result.paymentCode,
      instruction: result.paymentInstructions
    });
  },
  async formatCallback(): Promise<CallbackPayload> {
    return {
      protocol: "easypay_notify",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: ""
    };
  }
};

function decimalMoneyToMinor(value: string): number {
  const [integerPart, fractionPart = ""] = value.split(".");
  return Number.parseInt(integerPart, 10) * 100 + Number.parseInt(fractionPart.padEnd(2, "0").slice(0, 2), 10);
}
