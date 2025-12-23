// Safe fetch wrapper that handles HTML responses gracefully
export async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');

    // If response is not JSON, return null
    if (!contentType?.includes('application/json')) {
      return { ok: false, data: null, isHtml: true };
    }

    // If response is not ok, try to get error message
    if (!res.ok) {
      try {
        const errorData = await res.json();
        return { ok: false, data: null, error: errorData.message || 'Request failed' };
      } catch {
        return { ok: false, data: null, error: 'Request failed' };
      }
    }

    // Parse JSON response
    const data = await res.json();
    return { ok: true, data };

  } catch (err) {
    console.error('Fetch error:', err);
    return { ok: false, data: null, error: err.message };
  }
}

// Safe JSON parse from response
export async function safeJsonParse(res) {
  try {
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}
