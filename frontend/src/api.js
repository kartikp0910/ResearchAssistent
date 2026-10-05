const baseURL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function queryResearch(question, signal) {
  let response;
  try {
    response = await fetch(`${baseURL}/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Could not reach the research API. Check that FastAPI is running at http://127.0.0.1:8000, then try again.');
  }
  if (!response.ok) throw new Error(`The research API could not complete this request (HTTP ${response.status}). Check the backend and try again.`);
  let data;
  try { data = await response.json(); } catch { throw new Error('The API returned an unreadable response. Please try again.'); }
  if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('The API returned an empty or invalid answer. Please try again.');
  return data.answer;
}
