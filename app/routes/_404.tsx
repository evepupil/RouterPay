import type { NotFoundHandler } from "hono";

const handler: NotFoundHandler = (c) => {
  return c.render(
    <main class="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center px-6">
      <p class="text-sm font-medium text-muted">404</p>
      <h1 class="mt-3 text-3xl font-semibold text-ink">页面不存在</h1>
      <a class="mt-6 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white" href="/admin">
        返回管理后台
      </a>
    </main>,
    { title: "Not Found" }
  );
};

export default handler;
