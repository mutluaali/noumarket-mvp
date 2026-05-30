import { NextResponse } from 'next/server';
import { listClientPaymentProviders } from '@/lib/paymentProviders';

export async function GET() {
  return NextResponse.json({ providers: listClientPaymentProviders() });
}
