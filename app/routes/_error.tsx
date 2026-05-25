import type { ErrorHandler } from "hono";

const handler: ErrorHandler = (error, c) => {
  return c.render(
    <main class="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center px-6">
      <p class="text-sm font-medium text-danger">Error</p>
      <h1 class="mt-3 text-3xl font-semibold text-ink">RouterPay 处理请求失败</h1>
      <p class="mt-3 text-sm text-muted">{error.message}</p>
    </main>,
    { title: "Error" }
  );
};

export default handler;
