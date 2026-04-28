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
      console.log("[API Body] FormData: <FormData Object>");
    } else if (options.body) {
      console.log("[API Body]", options.body);
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      console.log(`[API Response] ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Error Body]`, errorText);
        try {
          const errorBody = JSON.parse(errorText);
          throw new Error(errorBody.detail || `API request failed with status ${response.status}`);
        } catch (e) {
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
      }

      // If response is 204 No Content or body is empty, return null/void
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null as unknown as T;
      }

      return await response.json();
    } catch (fetchError) {
      console.error(`[API Fetch Failure] Failed to reach ${fullUrl}`);
      console.error(fetchError);
      throw fetchError;
    }
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
