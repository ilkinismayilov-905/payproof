import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PayProof",
  description: "Fakturanı sifariş və təhvil sənədləri ilə tutuşdurun",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
