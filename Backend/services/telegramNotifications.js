const TELEGRAM_API_URL = "https://api.telegram.org";

async function sendTelegramNotification(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      sent: false,
      message: "Telegram is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
    };
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4000),
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const result = await response.json();

    if (!response.ok || !result.ok) {
      return {
        sent: false,
        message: "Telegram did not accept the notification. Check the bot token and chat ID.",
      };
    }

    return { sent: true, message: "Telegram notification sent." };
  } catch {
    return {
      sent: false,
      message: "Could not reach Telegram. The application was saved, but no notification was sent.",
    };
  }
}

module.exports = sendTelegramNotification;
