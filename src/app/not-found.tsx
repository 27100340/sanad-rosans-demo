import Link from "next/link";
import { school } from "@/lib/config/school";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <div className="card max-w-md p-8 text-center">
        <p className="eyebrow mb-2">{school.productName}</p>
        <h1 className="text-2xl font-medium text-ink">That page is not in this demo build.</h1>
        <p className="mt-2 text-sm text-ink-2">Pick a seat from the landing page or return to the portal.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="btn-outline">Landing</Link>
          <Link href="/portal" className="btn-primary">Portal</Link>
        </div>
      </div>
    </div>
  );
}
