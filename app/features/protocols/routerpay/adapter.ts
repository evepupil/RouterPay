import type {
  CallbackPayload,
  CreatePaymentInput,
  CreatePaymentResult,
  HttpRequestInput,
  InboundProtocolAdapter
} from "../types";
import { routerpayCreatePaymentSchema } from "./schema";

export const routerpayProtocolAdapter: InboundProtocolAdapter = {
  name: "routerpay",
  async parseCreatePayment(input: HttpRequestInput): Promise<CreatePaymentInput> {
    const body = routerpayCreatePaymentSchema.parse(input.body);

    return {
      merchantId: body.merchantId,
      merchantOrderId: body.merchantOrderId,
      inboundProtocol: "routerpay",
      provider: body.provider,
      amountMinor: body.amountMinor,
      currency: body.currency,
      orderName: body.orderName,
      notifyUrl: body.notifyUrl,
      returnUrl: body.returnUrl,
      metadata: body.metadata ?? {}
    };
  },
  formatCreatePaymentResult(result: CreatePaymentResult): Response {
    return Response.json(result);
  },
  async formatCallback(): Promise<CallbackPayload> {
    return {
      protocol: "routerpay_webhook",
      headers: { "content-type": "application/json" },
      body: "{}"
    };
  }
};
