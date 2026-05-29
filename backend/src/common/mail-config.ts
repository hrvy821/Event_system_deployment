export function mailPassword(envName: string) {
  return (process.env[envName] ?? '').replace(/\s+/g, '');
}
