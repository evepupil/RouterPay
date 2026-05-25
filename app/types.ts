export type AppBindings = {
  DB: D1Database;
  ROUTERPAY_WEBHOOK_SECRET?: string;
};

export type AppContext = {
  Bindings: AppBindings;
};
