import { Contact } from "@/types";

export class ApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function readErrorBody(
  response: Response,
  fallback: string,
): Promise<{ message: string; details: string[] }> {
  try {
    const data = await response.json();
    if (data && typeof data === "object") {
      const body = data as {
        error?: unknown;
        message?: unknown;
        details?: unknown;
      };
      const message = body.error ?? body.message;
      const details = Array.isArray(body.details)
        ? body.details.filter((d): d is string => typeof d === "string")
        : [];
      if (typeof message === "string" && message.trim()) {
        return { message, details };
      }
    }
  } catch {
    /* body was not JSON */
  }
  return { message: fallback, details: [] };
}

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  return (await readErrorBody(response, fallback)).message;
}

async function throwApiError(
  response: Response,
  fallback: string,
): Promise<never> {
  const { message, details } = await readErrorBody(response, fallback);
  throw new ApiError(message, response.status, details);
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  message: string;
  requiresVerification: boolean;
};

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

  async register(body: RegisterInput): Promise<RegisterResponse> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      await throwApiError(
        response,
        `Registration failed (${response.status}). Please try again.`,
      );
    }
    return response.json();
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      await throwApiError(
        response,
        `Could not resend the email (${response.status}). Please try again.`,
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
