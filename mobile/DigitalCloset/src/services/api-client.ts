const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Default content-type to JSON if not specified and not a FormData body
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const fullUrl = `${API_URL}${path}`;
    console.log(`[API Request] ${options.method || "GET"} ${fullUrl}`);
    console.log("[API Headers]", Object.fromEntries(headers.entries()));
    if (options.body instanceof FormData) {
      console.log("[API Body] FormData: " + JSON.stringify(Array.from(options.body.entries())));
    } else if (options.body) {
      console.log("[API Body]", options.body);
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`API Request Error [${path}]:`, error.message);
      throw error;
    }
    const unknownError = new Error('An unknown error occurred during the API request');
    console.error(`API Request Error [${path}]:`, unknownError.message);
    throw unknownError;
  }
}
