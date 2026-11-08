"use client";

import { permissionLabel, roleLabel } from "@payproof/api-client/i18n";
import { useMe } from "@/features/auth";

// Placeholder until the shell (W-04) and overview (W-06): shows who is signed in.
export default function HomePage() {
  const me = useMe().data;
  if (!me) return null;
  return (
    <main className="flex flex-col gap-2 p-8">
      <h1 className="text-2xl font-semibold">{me.full_name}</h1>
      <p className="text-text-2">
        {me.title} · {roleLabel[me.role]} · {me.company.name}
      </p>
      <ul aria-label="Səlahiyyətlər" className="flex flex-wrap gap-2">
        {me.permissions.map((p) => (
          <li key={p} className="bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-sm">
            {permissionLabel[p]}
          </li>
        ))}
      </ul>
    </main>
  );
}
