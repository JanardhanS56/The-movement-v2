export interface DonationConfig {
  payeeName: string
  purpose: string
  phone: string
  email: string
  paymentIdOrLink: string
  qrImagePath: string
}

export const DONATION_CONFIG: DonationConfig = {
  payeeName: "The Movement Foundation",
  purpose:
    "To sustain movements of all sizes by channeling donations made through our platform directly to the groups driving constructive societal change.",
  phone: "",
  email: "",
  paymentIdOrLink: "",
  qrImagePath: "/donate-qr.png",
}
