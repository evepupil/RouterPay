# RouterPay Project Guidelines

## 项目目标

RouterPay 是一个支付路由与回调标准化中间件，不是业务充值系统，也不是用户余额系统。

业务网站可以接 RouterPay 自定义接口，也可以接易支付兼容接口；RouterPay 负责把这两类入站接口都转换为统一内部订单模型，再对接多个底层支付渠道，例如爱发电、Stripe、支付宝、微信、Paddle 或其他收款方式。不同渠道的创建订单、验签、回调格式、状态枚举都由 RouterPay 适配并归一化，最终再按商户选择的回调协议回调业务网站。

第一阶段目标：

- 提供 RouterPay 自定义创建支付单接口。
- 提供易支付兼容创建支付单接口，降低已有业务系统迁移成本。
- 支持多商户或至少预留多商户模型。
- 提供管理后台，用于配置支付接口开关、回调接口开关和支付渠道参数。
- 先接入一个支付渠道，例如爱发电。
- 接收渠道 webhook，完成渠道验签、幂等去重、状态归一化。
- 支持 RouterPay 自定义 webhook 和易支付兼容 notify/return 回调。
- 记录原始渠道事件、标准支付事件和业务回调投递结果。
- 支持回调失败重试、查询和人工补发。
- 提供订单查看能力，后续扩展统计面板。

非目标：

- 不直接给业务用户写余额。
- 不直接发放 AI 额度、会员、卡密或商品。
- 不在 RouterPay 中实现业务站的套餐权益逻辑。
- 不让客户端决定真实价格、到账额度或业务发货结果。
- 不把易支付兼容层作为内部核心模型；它只是入站和出站适配协议。
- 第一版不做复杂清结算、分账、风控审核后台或支付渠道自动择优。

## 技术栈

- Framework: Hono
- Runtime: Cloudflare Workers
- Language: TypeScript
- Validation: Zod
- Database: Cloudflare D1
- Optional cache/config: Cloudflare KV
- Deployment: Wrangler / Cloudflare Workers
- Testing: Vitest or the repo's chosen TypeScript test runner

### 管理后台

- App framework: HonoX or Hono + Vite, follow the actual scaffold chosen in this repo.
- Styling: Tailwind CSS.
- UI components: shadcn/ui-compatible source components.
- Icons: Lucide icons.
- Forms: React Hook Form or equivalent lightweight form handling.
- Client validation: Zod schemas shared with server where practical.
- Tables: TanStack Table or a small local table abstraction if dependency weight is not worth it.
- Charts: Recharts or Tremor-compatible chart primitives when the statistics panel is added.

管理后台是项目正式范围，不是营销页。第一屏应直接进入支付配置、订单或运行状态，不做大段宣传落地页。

## 核心边界

### RouterPay 负责

- 统一支付单创建接口。
- 易支付兼容接口适配。
- 支付渠道配置读取与适配。
- 渠道请求签名或鉴权。
- 渠道 webhook 入站验签。
- 渠道订单状态归一化。
- 支付事件幂等处理。
- 标准 webhook 签名与投递。
- 易支付兼容 notify/return 回调投递。
- 投递失败重试、查询、补发。
- 支付链路审计日志。
- 管理后台的配置、查询和审计视图。

### 业务网站负责

- 用户账号。
- 商品、套餐、AI 额度、会员权益。
- 业务订单与发货状态。
- 收到 RouterPay webhook 后的入账、开通、发货或退款处理。
- 自己的业务幂等逻辑。
- 在自己的业务后台展示充值、会员或发货状态。

RouterPay 只承诺“支付事件可靠、可信、可审计地转发给业务网站”，不承诺“业务余额已经到账”。

## 管理后台功能

管理后台用于配置 RouterPay 自身能力，不用于处理业务网站的用户余额。

第一版页面：

- Overview: 展示当前启用的入站协议、启用的支付渠道、最近订单、最近失败回调。
- 接口开关: 控制 RouterPay 自定义接口、易支付兼容接口是否启用。
- 回调开关: 控制 RouterPay 自定义 webhook、易支付兼容 notify/return 是否启用。
- 支付渠道配置: 管理爱发电、Stripe、支付宝、微信、Paddle 等 provider 的启用状态、密钥引用、路由优先级和测试模式。
- 订单列表: 查询订单号、商户订单号、渠道订单号、状态、金额、币种、支付方式、创建时间、支付时间。
- 订单详情: 查看标准事件、原始渠道事件摘要、业务回调投递记录和重试入口。
- 回调投递记录: 查看投递 URL、状态码、响应摘要、错误信息、重试次数、下一次重试时间。

后续扩展：

- 统计面板: 按日、渠道、商户、支付方式统计订单量、成功率、金额和回调失败率。
- 渠道路由规则: 按支付方式、金额、商户或可用性选择 provider。
- 手动补发: 对失败或历史订单重新投递业务站回调。

管理后台交互原则：

- 所有危险操作，例如禁用支付接口、禁用回调、删除渠道配置、重置密钥，必须有确认。
- 密钥类字段只允许写入和更新，不回显明文。
- 配置表单必须有清晰的保存成功、保存失败、校验失败状态。
- 列表页必须有空状态、加载状态、错误状态。
- 订单和回调详情优先展示可排查字段，不展示完整敏感 payload。

## 对外协议

RouterPay 对业务网站支持两种接口协议：

1. RouterPay 自定义接口。
2. 易支付兼容接口。

这两种协议都是业务网站接入 RouterPay 的入口，不是底层支付渠道模型。无论业务网站使用哪种协议，RouterPay 内部都必须转换为统一订单、统一支付事件和统一回调投递记录。

### RouterPay 自定义接口

RouterPay 自定义接口适合新业务接入，字段命名、签名、状态和错误结构都由 RouterPay 控制。

特点：

- 使用 JSON 请求和响应。
- 使用 RouterPay API key 或请求签名鉴权。
- 金额使用最小货币单位整数，例如 CNY 分。
- 支持结构化 `metadata`。
- 支持标准 webhook 签名。
- 适合未来扩展退款、查询、补发、路由规则和多渠道能力。

### 易支付兼容接口

易支付兼容接口适合已有系统低成本迁移。目标是让已经接过易支付接口的业务网站，可以把支付网关地址切到 RouterPay。

特点：

- 尽量兼容易支付常见字段和签名习惯，例如 `pid`、`type`、`out_trade_no`、`notify_url`、`return_url`、`name`、`money`、`sitename`、`sign`、`sign_type`。
- 入站金额可以接收易支付常见 decimal 字符串，但进入 RouterPay 内部前必须转换为最小货币单位整数。
- 易支付字段只能在 compatibility layer 解析，不允许污染内部核心模型。
- 易支付 `notify_url` 和 `return_url` 是业务站回调目标，RouterPay 投递时要按兼容协议生成响应。
- 易支付兼容层也必须做商户鉴权、签名校验、幂等和审计。

不确定具体易支付字段、签名排序、返回格式或同步跳转行为时，必须先查目标易支付实现的文档或以用户指定的接口样例为准，不要凭印象写死。

## 支付流

标准流程：

```txt
业务网站 -> RouterPay 自定义接口或易支付兼容接口创建支付单
RouterPay -> 转换为统一内部订单模型
RouterPay -> 根据 payment_method / route 选择支付渠道
RouterPay -> 创建或绑定渠道订单
用户 -> 到支付渠道完成付款
支付渠道 -> webhook 回调 RouterPay
RouterPay -> 验签、去重、归一化状态
RouterPay -> 按商户接入协议回调业务网站
业务网站 -> 自行加余额、发货、开会员或处理失败
```

业务网站应该只信任 RouterPay 回调，不需要理解每个支付渠道自己的回调格式。使用 RouterPay 自定义接口的业务站验 RouterPay webhook 签名；使用易支付兼容接口的业务站按易支付兼容规则验签和处理 `notify_url` / `return_url`。

## 统一状态模型

内部支付状态必须稳定，不直接泄露渠道枚举。

建议状态：

```ts
type RouterPayOrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "partially_refunded"
  | "closed";
```

渠道状态只能在 provider adapter 内转换为标准状态。业务网站 webhook 只接收标准状态。

## 回调协议

RouterPay 出站回调支持两种协议：

1. RouterPay 自定义 webhook。
2. 易支付兼容 notify/return。

内部支付事件只能生成一次；不同出站协议只是投递格式不同，不能生成两套业务事实。

### RouterPay 自定义 Webhook

RouterPay 回调业务网站时，payload 必须由 RouterPay 生成，并使用商户级 webhook secret 签名。

建议 payload：

```json
{
  "event_id": "evt_xxx",
  "event_type": "payment.paid",
  "merchant_id": "m_xxx",
  "merchant_order_id": "biz_order_123",
  "routerpay_order_id": "rp_order_456",
  "provider": "afdian",
  "provider_trade_no": "202605250001",
  "status": "paid",
  "amount": 1000,
  "currency": "CNY",
  "paid_at": "2026-05-25T12:00:00Z",
  "metadata": {
    "plan_id": "ai_credits_1000"
  }
}
```

签名规则应稳定且文档化，例如：

```txt
RouterPay-Timestamp: <unix seconds>
RouterPay-Signature: v1=<hmac_sha256(timestamp + "." + raw_body, webhook_secret)>
```

业务网站必须校验 timestamp、防重放窗口和 signature。

### 易支付兼容 Notify / Return

易支付兼容接口必须区分异步通知和同步跳转：

- `notify_url`: 服务端异步通知，应该作为业务入账的主要依据。
- `return_url`: 用户支付完成后的浏览器跳转，只能用于页面展示，不应作为业务入账唯一依据。

RouterPay 投递易支付兼容 `notify_url` 时，应生成兼容字段，例如：

```txt
pid=<merchant_pid>
trade_no=<routerpay_order_id or compatible trade no>
out_trade_no=<merchant_order_id>
type=<payment_type>
name=<order_name>
money=<decimal amount>
trade_status=TRADE_SUCCESS
sign=<compatible signature>
sign_type=MD5
```

具体字段、签名算法和成功响应文本必须按目标易支付兼容约定实现。常见成功响应可能是 `success`，但不能在未确认时硬编码为唯一规则。

## 数据模型规范

D1 存的是支付路由和事件审计，不存业务用户余额。

建议核心表：

- `merchants`: 业务站、回调地址、webhook secret hash 或加密后的 secret、状态。
- `merchant_api_credentials`: RouterPay API key、易支付兼容 `pid`、密钥 hash 或加密密钥引用。
- `provider_configs`: 商户绑定的支付渠道配置。
- `payment_routes`: 支付方式、渠道优先级、启用状态和路由规则。
- `protocol_settings`: 商户或全局维度的 RouterPay 自定义接口、易支付兼容接口、回调协议开关。
- `orders`: RouterPay 内部订单，绑定商户订单号、入站协议、渠道订单号、金额、币种、状态。
- `provider_events`: 原始渠道 webhook 事件，保存原始 payload、headers 摘要、验签结果和唯一事件 key。
- `payment_events`: 归一化后的标准支付事件。
- `callback_deliveries`: RouterPay 向业务站投递 webhook 的记录、响应码、错误、重试次数。
- `compat_requests`: 可选，记录易支付兼容接口的原始请求摘要，便于排查迁移问题。

幂等建议：

- `orders` 对 `merchant_id + merchant_order_id` 建唯一约束。
- 如果同一商户同时使用 RouterPay 自定义接口和易支付兼容接口，唯一约束需要明确是否包含 `inbound_protocol`，避免两个协议误用同一商户订单号。
- `provider_events` 对 `provider + provider_event_id` 或 `provider + provider_trade_no + event_type` 建唯一约束。
- `payment_events` 对标准 `event_id` 建唯一约束。
- `callback_deliveries` 记录每次投递尝试，不覆盖历史。

金额规范：

- 金额使用最小货币单位整数，例如 CNY 分、USD cent。
- 币种使用 ISO currency code，例如 `CNY`、`USD`。
- 不使用浮点数保存金额。

时间规范：

- 数据库存 UTC ISO timestamp。
- 不依赖 Worker 运行环境时区。

## Provider Adapter 规范

每个支付渠道必须封装在独立 provider adapter 中。route handler 不允许直接写渠道特定逻辑。

adapter 建议职责：

- 创建渠道支付单。
- 验证渠道 webhook 签名。
- 提取渠道事件唯一 key。
- 将渠道状态转换为 RouterPay 标准状态。
- 保留必要的原始字段用于审计。

建议接口：

```ts
interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedProviderEvent>;
  normalizeEvent(event: VerifiedProviderEvent): Promise<NormalizedPaymentEvent>;
}
```

新增支付渠道时，只能新增或扩展对应 adapter 和配置 schema，不应改动业务站统一 webhook 协议。

## Compatibility Adapter 规范

RouterPay 自定义接口和易支付兼容接口都属于 inbound compatibility adapter。

compatibility adapter 职责：

- 解析入站协议字段。
- 校验商户身份和签名。
- 转换金额、币种、订单号、支付方式和 metadata。
- 生成统一 `CreatePaymentInput`。
- 把内部支付事件转换为该协议的出站回调格式。

compatibility adapter 不负责：

- 选择底层支付渠道。
- 修改 provider webhook 逻辑。
- 写业务余额。
- 决定业务站是否发货。

建议接口：

```ts
interface InboundProtocolAdapter {
  name: "routerpay" | "easypay";
  parseCreatePayment(input: HttpRequestInput): Promise<CreatePaymentInput>;
  formatCreatePaymentResult(result: CreatePaymentResult): HttpResponseOutput;
  formatCallback(event: NormalizedPaymentEvent): Promise<CallbackPayload>;
  verifyMerchantRequest?(input: HttpRequestInput): Promise<MerchantIdentity>;
}
```

## API 规范

API 使用 `/api/v1` 前缀。

建议路由：

```txt
POST /api/v1/payments
GET  /api/v1/payments/:routerpay_order_id
POST /api/v1/providers/:provider/webhook
GET  /api/v1/events/:event_id
GET  /api/v1/callback-deliveries/:delivery_id
POST /api/v1/callback-deliveries/:delivery_id/retry
GET  /api/v1/admin/protocol-settings
PUT  /api/v1/admin/protocol-settings
GET  /api/v1/admin/provider-configs
POST /api/v1/admin/provider-configs
PUT  /api/v1/admin/provider-configs/:provider_config_id
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:routerpay_order_id
GET  /api/v1/admin/stats

GET  /submit.php
POST /submit.php
GET  /mapi.php
POST /mapi.php
GET  /api.php
POST /api.php
```

`/api/v1/*` 是 RouterPay 自定义接口。`/submit.php`、`/mapi.php`、`/api.php` 是易支付兼容入口，是否全部实现取决于目标兼容范围；不要在没有需求时盲目实现全部易支付变体。

接口规则：

- 所有写接口必须鉴权。
- 商户接口使用 API key 或签名请求，不使用普通前端 session。
- 管理后台接口必须使用后台登录态或管理员 token，不能复用商户支付 API key。
- 易支付兼容接口必须按兼容协议校验 `pid`、`sign`、`sign_type`。
- 所有 body、query、params 必须用 Zod 校验。
- route handler 只负责 HTTP 输入输出，业务流程下沉到 feature service。
- API 错误返回稳定结构：

```ts
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## 安全规范

- 不在日志中打印完整 API key、webhook secret、渠道密钥、支付 token。
- 商户 API key 只展示一次，服务端只保存 hash。
- 渠道密钥如需存 D1，必须有清晰的加密方案；否则优先使用 Worker secrets 或受控配置。
- 渠道 webhook 必须验签，验签失败不得进入支付状态流转。
- RouterPay 发给业务网站的 webhook 必须签名。
- 易支付兼容 notify 也必须签名，不能因为兼容老接口而降低安全边界。
- 回调必须有幂等事件 ID。
- 对 webhook 入站接口设置合理 rate limit 或等价保护。
- 对业务站回调失败设置最大重试次数和退避策略。
- 不把原始渠道 payload 直接转发给业务站作为可信字段。
- 管理后台不得回显完整密钥、API key、webhook secret 或渠道 secret。
- 管理后台展示原始 webhook payload 时必须默认脱敏，必要时只展示字段摘要。

## 目录结构规范

项目目录优先按功能域组织，而不是按技术类型平铺。

建议结构：

```txt
src/
  routes/
    admin/
      index.tsx
      protocol-settings.tsx
      provider-configs.tsx
      orders/
        index.tsx
        [routerpay_order_id].tsx
      callbacks.tsx
      stats.tsx
    api/
      v1/
        payments.ts
        provider-webhooks.ts
        callback-deliveries.ts
        admin/
          protocol-settings.ts
          provider-configs.ts
          orders.ts
          stats.ts
    compat/
      easypay.ts
  features/
    merchants/
      schema.ts
      service.ts
      repository.ts
    payments/
      schema.ts
      service.ts
      repository.ts
      status.ts
    protocols/
      routerpay/
        adapter.ts
        schema.ts
        signing.ts
      easypay/
        adapter.ts
        schema.ts
        signing.ts
        format.ts
    providers/
      registry.ts
      types.ts
      afdian/
        adapter.ts
        schema.ts
      stripe/
        adapter.ts
        schema.ts
    webhooks/
      signing.ts
      delivery.ts
      retry.ts
      schema.ts
      repository.ts
    admin/
      auth.ts
      protocol-settings.ts
      provider-configs.ts
      order-queries.ts
      stats.ts
      components/
        protocol-switches.tsx
        provider-config-form.tsx
        orders-table.tsx
        callback-deliveries-table.tsx
  db/
    schema.ts
    migrations/
  lib/
    env.ts
    errors.ts
    http.ts
    crypto.ts
    money.ts
    time.ts
  components/
    ui/
    tables/
    charts/
```

目录规则：

- 新业务优先新增或扩展 `features/<feature-name>`。
- `routes` 只负责 HTTP 层，不堆业务逻辑。
- provider 特定逻辑只放在 `features/providers/<provider>/`。
- 入站协议兼容逻辑只放在 `features/protocols/<protocol>/`。
- 管理后台页面放在 `routes/admin`，后台业务查询和配置逻辑放在 `features/admin`。
- 后台组件优先放在 `features/admin/components`，真正通用 UI 原语才放在 `components/ui`。
- 跨 provider 的标准类型放在 `features/providers/types.ts` 或共享 package。
- `lib` 只放无业务归属的基础设施能力。
- 不允许多个 provider 复制同一套签名、金额、时间、错误处理逻辑；应抽成共享 helper。

## TypeScript 规范

- 开启 strict mode。
- 外部输入一律用 Zod parse 后再进入业务逻辑。
- 数据库字段使用 snake_case。
- TypeScript 字段使用 camelCase。
- route path 使用 kebab-case。
- provider name 使用稳定枚举值，例如 `afdian`、`stripe`。
- inbound protocol 使用稳定枚举值，例如 `routerpay`、`easypay`。
- 金额用整数，不用浮点数。
- 不在 route handler 里直接拼 SQL 或写复杂业务流程。

## 测试规范

优先覆盖：

- provider webhook 验签。
- provider event normalize。
- 支付状态转换。
- 订单创建幂等。
- 渠道回调重复投递不重复生成业务事件。
- RouterPay webhook 签名。
- 业务站回调失败重试。
- 金额和币种校验。
- 异常 payload、缺字段、未知状态、验签失败。
- RouterPay 自定义接口创建支付单。
- 易支付兼容接口创建支付单、签名校验和金额转换。
- RouterPay 自定义 webhook 格式化和签名。
- 易支付兼容 notify/return 格式化和成功响应判断。
- 管理后台配置接口鉴权。
- 支付接口和回调接口开关生效逻辑。
- 支付渠道配置保存、脱敏展示和禁用逻辑。
- 订单列表筛选和订单详情查询。

测试不依赖真实支付渠道时，应使用 fixture JSON。涉及外部平台行为、签名算法或 Cloudflare D1 限制时，必须查官方文档或用最小脚本验证后再下结论。

## 开发流程

- 先确定统一协议和数据模型，再实现具体支付渠道。
- 先实现 provider 无关、protocol 无关的订单、事件、回调投递核心，再接入具体渠道和具体入站协议。
- RouterPay 自定义接口和易支付兼容接口都必须走同一套内部 service，不允许各自写一套订单和回调流程。
- 管理后台优先服务真实运维动作：接口开关、渠道配置、订单查看、回调排查；统计面板后置。
- 每个 provider adapter 必须可独立测试。
- 每个 protocol adapter 必须可独立测试。
- 重要行为变更必须补测试。
- 修改代码前先说明将修改的文件和意图。
- 遇到读取错误或乱码文件时，使用 `jiemi.exe <文件路径>` 解密后再读取。
- 不确定的外部 API、第三方库行为或 Cloudflare 平台限制，需要查官方资料后再下结论。

## 交流约定

- 默认使用简体中文沟通。
- 保持 RouterPay 的职责边界：支付路由和回调标准化，不写业务余额。
- 支持 RouterPay 自定义接口和易支付兼容接口，但内部模型必须统一。
- 讨论充值、AI 额度、会员时，要明确这是业务网站的职责，不是 RouterPay 的职责。
- 任何涉及密钥、签名、回调、金额、幂等的问题，都优先按安全和审计边界处理。
