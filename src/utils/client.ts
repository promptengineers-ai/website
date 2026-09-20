import { Contact } from "@/types";

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data === "object") {
      const message =
        (data as { error?: unknown; message?: unknown }).error ??
        (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  } catch {
    /* body was not JSON */
  }
  return fallback;
}

class APIClient {
  async contactFormSubmit(body: Contact): Promise<any> {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          `Signup failed (${response.status}). Please try again.`,
        ),
      );
    }
    return response.json();
  }

  async subscribeToNewsletter(body: { email: string }): Promise<any> {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    console.log(data);
    return data;
  }
}

export const apiClient = new APIClient();
