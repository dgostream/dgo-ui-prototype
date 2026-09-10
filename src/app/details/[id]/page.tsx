import { Suspense } from "react";
import { getStaticContentIds } from "@/utils/content";
import DetailsClient from "./DetailsClient";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticContentIds().map((id) => ({ id }));
}

export default function DetailsPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DetailsClient {...props} />
    </Suspense>
  );
}
