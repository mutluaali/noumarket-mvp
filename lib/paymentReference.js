export async function generatePaymentReference(supabase) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const reference = `NM-${year}-${suffix}`;
    const { data } = await supabase
      .from('payment_orders')
      .select('id')
      .eq('reference', reference)
      .maybeSingle();
    if (!data) return reference;
  }
  throw new Error('Ödeme referansı oluşturulamadı.');
}
