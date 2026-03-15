export class PaymentServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Payment service error");
    this.status = status;
    this.payload = payload;
  }
}
