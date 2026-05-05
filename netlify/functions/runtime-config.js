exports.handler = async () => {
  const paypalClientId = String(process.env.LPS_PAYPAL_CLIENT_ID || "").trim();

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify({
      paypalClientId,
    }),
  };
};
