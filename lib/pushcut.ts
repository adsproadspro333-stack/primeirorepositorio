// lib/pushcut.ts

export async function sendPushcutNotification(
  url: string | undefined,
  payload: any,
) {
  if (!url) {
    console.warn("PUSHCUT url não configurada, notificações desativadas.")
    return
  }

  try {
    // Se o Pushcut aceitar GET simples, dá pra trocar pra method: "GET"
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    console.log("PUSHCUT resposta:", res.status, text)
  } catch (err) {
    console.error("Erro ao enviar notificação Pushcut:", err)
  }
}
