import Link from 'next/link';

export default function NotFound() {
  return <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 pb-28 text-center">
    <p className="text-sm font-semibold text-primary-dark">BloodNet · 404</p>
    <h1 className="mt-4 text-4xl font-semibold text-text">Page not found</h1>
    <p className="mt-4 text-text/70">This page may have moved or is no longer public. Use the menu to continue browsing BloodNet.</p>
    <Link href="/" className="mt-6 rounded-full bg-primary-dark px-6 py-3 text-sm font-semibold text-white">Return to BloodNet</Link>
  </main>;
}
