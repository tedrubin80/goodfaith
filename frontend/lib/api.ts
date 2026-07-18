const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      if (typeof payload.detail === "string") {
        message = payload.detail;
      } else if (typeof payload === "object" && payload !== null) {
        const parts = Object.entries(payload).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((item) => `${key}: ${String(item)}`);
          }
          if (typeof value === "string") {
            return [`${key}: ${value}`];
          }
          return [];
        });
        if (parts.length > 0) message = parts.join(" ");
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function downloadExport(
  format: "json" | "csv",
  token: string,
  labelId?: number,
): Promise<void> {
  const params = new URLSearchParams({ export_format: format });
  if (labelId) params.set("label", String(labelId));

  const response = await fetch(`${API_URL}/api/export/?${params}`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { detail?: string; label?: string[] };
      if (payload.detail) message = payload.detail;
      else if (payload.label?.[0]) message = payload.label[0];
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `goodfaith-export.${format === "json" ? "json" : "zip"}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadAchExport(batchId: number, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/payments/batches/${batchId}/ach_export/`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    throw new ApiError("ACH export failed.", response.status);
  }

  await downloadBlobResponse(response, `ach-batch-${batchId}.csv`);
}

export async function downloadRoyaltyRunPdf(runId: number, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/royalties/runs/${runId}/pdf/`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    throw new ApiError("PDF download failed.", response.status);
  }

  await downloadBlobResponse(response, `royalty-run-${runId}.pdf`);
}

export async function downloadPayoutBatchPdf(batchId: number, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/payments/batches/${batchId}/pdf/`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    throw new ApiError("PDF download failed.", response.status);
  }

  await downloadBlobResponse(response, `payout-batch-${batchId}.pdf`);
}

export async function downloadPayoutPdf(payoutId: number, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/payments/payouts/${payoutId}/pdf/`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    throw new ApiError("PDF download failed.", response.status);
  }

  await downloadBlobResponse(response, `payout-${payoutId}.pdf`);
}

async function downloadBlobResponse(response: Response, fallbackName: string): Promise<void> {
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackName;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { API_URL };
