// All browser traffic goes through Node. The Python agent is never called here.
export async function api(path, body) {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    ...(body instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
    ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The backend returned an unexpected response. Check that the Node API is running.'); }
  if (!response.ok) {
    const detail = data.detail || data.error || `Request failed (${response.status})`;
    throw new Error(typeof detail === 'string' ? detail : detail.map(item => item.msg || 'Invalid input').join('; '));
  }
  return data;
}
