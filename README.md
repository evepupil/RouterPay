# RouterPay

RouterPay is a Cloudflare Workers + HonoX payment routing middleware.

It exposes RouterPay-native APIs and EasyPay-compatible APIs to business sites, normalizes provider callbacks, and delivers signed callbacks back to the business site. RouterPay does not write business balances or issue product entitlements.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm test
```

## First Scope

- RouterPay-native payment API.
- EasyPay-compatible payment API.
- Provider webhook normalization.
- Admin console for protocol switches, provider configuration, order lookup, and callback delivery review.
- D1 schema for orders, provider events, normalized events, and callback deliveries.
