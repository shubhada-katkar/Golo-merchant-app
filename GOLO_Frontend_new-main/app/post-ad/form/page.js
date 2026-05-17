"use client";

import { Suspense } from "react";
import FormContent from "./FormContent";

export default function FormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      Loading form...
    </div>}>
      <FormContent />
    </Suspense>
  );
}