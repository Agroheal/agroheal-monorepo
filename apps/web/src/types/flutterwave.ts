export interface FlutterwaveCustomer {
  email: string;
  name: string;
  phone_number?: string;
}

export interface FlutterwaveCustomizations {
  title: string;
  description: string;
  logo?: string;
}

export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: FlutterwaveCustomer;
  meta?: Record<string, unknown>;
  customizations: FlutterwaveCustomizations;
  onclose: () => void;
  callback: (response: FlutterwaveResponse) => void | Promise<void>;
}

export interface FlutterwaveResponse {
  status: string;
  transaction_id?: string | number;
  tx_ref?: string;
  [key: string]: unknown;
}
