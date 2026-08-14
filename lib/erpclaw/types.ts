export type GatewayConfig = {
  baseUrl: string;
  token?: string;
  allowInsecureLocal: boolean;
};

export type GatewayHealth = {
  status: "ok";
  engine: string;
  version?: string;
  catalogTotal?: number;
};

export type GatewayCatalog = {
  actions: string[];
  total: number;
  generatedAt?: string;
};

export type Company = {
  id: string;
  name: string;
  abbr?: string;
  currency?: string;
  country?: string;
};

export type ActionResult = Record<string, unknown> & {
  status?: string;
  message?: string;
};

export type ActionSafety = "read" | "write" | "destructive";

export class GatewayError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.details = details;
  }
}
