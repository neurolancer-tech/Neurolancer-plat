export async function executeRecaptcha(action: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    const siteKey = (process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY as string) || '6LdUts8rAAAAAHVZ5e2HMAroKflKvM1Od7UXd7X9';
    const gre = (window as any).grecaptcha?.enterprise;
    if (!gre || !siteKey) return null;
    await new Promise<void>((resolve) => gre.ready(() => resolve()));
    const token = await gre.execute(siteKey, { action });
    return token || null;
  } catch (e) {
    console.warn('executeRecaptcha failed', e);
    return null;
  }
}
