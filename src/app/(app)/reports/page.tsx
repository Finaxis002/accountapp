import { redirect } from 'next/navigation';

export default function ReportsPage() {
  redirect('/reports/profit-loss');
  return null;
}
