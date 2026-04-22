import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-700">
      <p className="font-medium text-stone-900">Article not in the current feed window.</p>
      <p className="mt-1">
        Feeds only include the latest headlines. Older articles drop off as new ones arrive.
      </p>
      <Link
        href="/"
        className="mt-3 inline-block text-stone-900 underline underline-offset-4"
      >
        Back to headlines
      </Link>
    </section>
  );
}
