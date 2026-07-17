
const res = {
  ok: false,
  statusText: 'Forbidden',
  status: 403,
  json: async () => ({ message: 'Admin access required' })
};
async function test() {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || 'API Error');
    console.log('Error message:', error.message);
  }
}
test();

