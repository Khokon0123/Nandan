/**
 * SMS gateway abstraction. In production, swap the body of this function for
 * a call to a Bangladeshi SMS gateway (BulkSMSBD, Alpha SMS, sms.bd, etc.)
 * via their REST API. In local development, the OTP is just logged.
 */
export async function sendOtp(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.SMS_API_URL) {
    // Example shape for a REST-based gateway - adjust to the provider's actual API.
    await fetch(process.env.SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.SMS_API_KEY,
        to: phone,
        message: `Your Nandan verification code is ${code}. It expires in 5 minutes.`,
      }),
    });
    return;
  }

  console.log(`[sendOtp] OTP for ${phone}: ${code}`);
}
