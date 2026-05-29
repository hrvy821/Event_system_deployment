export function mailPassword(envName: string) {
  return (process.env[envName] ?? '').replace(/\s+/g, '');
}

export function gmailTransport(envName: string) {
  return {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: false,
    requireTLS: true,
    family: 4,
    pool: true,
    maxConnections: 1,
    maxMessages: 25,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    tls: {
      servername: 'smtp.gmail.com',
    },
    auth: {
      user: process.env.MAIL_USER,
      pass: mailPassword(envName),
    },
  };
}

export function shouldLogDevOtp() {
  return process.env.SHOW_DEV_OTP === 'true';
}
