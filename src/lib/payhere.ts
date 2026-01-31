
export const payhereConfig = {
    sandbox: true, // Force sandbox mode for now
    merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payhere/notify`,
};

export const payhereUrls = {
    checkout: 'https://sandbox.payhere.lk/pay/checkout',
};

    