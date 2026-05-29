export function queueMail(
  transporter: { sendMail: (options: any) => Promise<any> },
  mailOptions: any,
  context: string,
) {
  const started = Date.now();

  void transporter.sendMail(mailOptions)
    .then(() => {
      const elapsed = Date.now() - started;
      console.log(`[MAIL] ${context} sent in ${elapsed}ms`);
    })
    .catch((error: any) => {
      console.error(`[MAIL] ${context} failed:`, error?.message || error);
    });
}
