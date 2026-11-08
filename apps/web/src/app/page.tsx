import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">PayProof</h1>
      <p className="text-text-2 mt-2">Paket göndərilməyə hazırdır</p>
      <div className="mt-4 flex gap-2">
        <span className="bg-success-bg text-success rounded-md px-3 py-1">Uğurlu</span>
        <span className="bg-danger-bg text-danger rounded-md px-3 py-1">Xəta</span>
        <span className="bg-surface border-border rounded-md border px-3 py-1">Səth</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button>Təsdiqlə</Button>
        <Button variant="outline">Ləğv et</Button>
        <Button variant="destructive">Sil</Button>
      </div>
    </main>
  );
}
