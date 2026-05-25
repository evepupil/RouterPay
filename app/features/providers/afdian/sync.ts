import type { createDb } from "@/db/client";
import { getProviderConfigByProvider } from "@/features/admin/repository";
import { handleProviderWebhook } from "@/features/payments/webhooks";
import type { DeliveryFetch } from "@/features/webhooks/delivery";
import { md5Hex } from "@/lib/crypto";

const AFDIAN_QUERY_ORDER_URL = "https://afdian.net/api/open/query-order";

export async function syncAfdianOrders(
  db: ReturnType<typeof createDb>,
  options: {
    fetchImpl?: DeliveryFetch;
    secretEncryptionKey?: string;
    page?: number;
  } = {}
) {
  const config = await getProviderConfigByProvider(db, "afdian");
  const userId = readConfigString(config?.config, "userId");
  const apiToken = readConfigString(config?.config, "apiToken");

  if (!userId || !apiToken) {
    throw new Error("Afdian userId/apiToken is not configured");
  }

  const page = options.page ?? 1;
  const requestBody = await createQueryOrderRequest({ userId, apiToken, page });
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(AFDIAN_QUERY_ORDER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  const payload = (await response.json()) as Record<string, unknown>;
  assertAfdianApiSuccess(payload);
  const orders = readOrders(payload);
  let processed = 0;
  let matched = 0;

  for (const order of orders) {
    processed += 1;
    const rawBody = JSON.stringify({
      ec: 200,
      em: "ok",
      data: {
        type: "order",
        order
      }
    });

    try {
      const result = await handleProviderWebhook(db, {
        providerName: "afdian",
        headers: new Headers(),
        rawBody,
        fetchImpl,
        secretEncryptionKey: options.secretEncryptionKey
      });
      if (!result.duplicate) {
        matched += 1;
      }
    } catch {
      // Unmatched synced orders are expected until a user includes the remark code.
    }
  }

  return {
    processed,
    matched
  };
}

async function createQueryOrderRequest(input: { userId: string; apiToken: string; page: number }) {
  const params = JSON.stringify({
    page: input.page
  });
  const ts = Math.floor(Date.now() / 1000);
  const sign = await md5Hex(`${input.apiToken}params${params}ts${ts}user_id${input.userId}`);

  return {
    user_id: input.userId,
    params,
    ts,
    sign
  };
}

function readOrders(payload: Record<string, unknown>): Array<Record<string, unknown>> {
  const data = payload.data;

  if (!data || typeof data !== "object") {
    return [];
  }

  const list = (data as Record<string, unknown>).list;
  return Array.isArray(list) ? list.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
}

function assertAfdianApiSuccess(payload: Record<string, unknown>) {
  const code = payload.ec;

  if (code === undefined || code === 200 || code === "200") {
    return;
  }

  const message = typeof payload.em === "string" && payload.em ? payload.em : `ec=${String(code)}`;
  throw new Error(`Afdian order sync failed: ${message}`);
}

function readConfigString(config: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = config?.[key];
  return typeof value === "string" && value ? value : undefined;
}
