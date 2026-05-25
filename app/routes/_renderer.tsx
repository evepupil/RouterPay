import { Link, Script } from "honox/server";
import { jsxRenderer } from "hono/jsx-renderer";

export default jsxRenderer(({ children, title }) => {
  const pageTitle = title ? `${title} - RouterPay` : "RouterPay";

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />
      </head>
      <body>{children}</body>
    </html>
  );
});
