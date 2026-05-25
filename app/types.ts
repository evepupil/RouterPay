export type AppBindings = {
  DB: D1Database;
  ROUTERPAY_SECRET_ENCRYPTION_KEY?: string;
};

export type AppContext = {
  Bindings: AppBindings;
};
