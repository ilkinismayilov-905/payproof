import customers from "@fixtures/customers.json";
import newsets from "@fixtures/newsets.json";
import { toFormData, unwrap, type Schemas } from "@payproof/api-client";
import { api } from "@/lib/api";

type Slot = "invoice" | "order" | "delivery";

export interface NewPackageInput {
  customerId: string;
  ownerId: string;
  files: Partial<Record<Slot, File>> & { invoice: File };
  /** One per user intent: a retried request must not create a second package. */
  idempotencyKey: string;
}

/** Starts extraction; the package (if any) is PROCESSING until the job finishes. */
export const createPackageRequest = ({
  customerId,
  ownerId,
  files,
  idempotencyKey,
}: NewPackageInput) =>
  unwrap(
    api.POST("/v1/packages", {
      params: { header: { "Idempotency-Key": idempotencyKey } },
      body: { customer_id: customerId, owner_id: ownerId, ...files },
      bodySerializer: toFormData,
    }),
  );

const DONE = new Set(["SUCCEEDED", "FAILED"]);

/**
 * Polls a job until it ends. Not tied to a component: creating a package navigates away from the
 * dialog, and the job must still be followed (in mock mode polling is what finishes it).
 */
export async function waitForJob(jobId: string, intervalMs = 800): Promise<Schemas["Job"]> {
  for (;;) {
    const job = await unwrap(api.GET("/v1/jobs/{job_id}", { params: { path: { job_id: jobId } } }));
    if (DONE.has(job.status)) return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** Demo document sets for mock mode (fixtures name customers by slug; the UI knows names). */
export const demoSets = () =>
  newsets.map((s) => ({
    id: s.id,
    invoiceNumber: s.invoice_number,
    customerName: customers.find((c) => c.id === s.customer_id)?.name ?? "",
    note: s.note,
    // fixture order is invoice, order, delivery (a missing delivery note is simply absent)
    files: {
      invoice: s.files[0]!,
      ...(s.files[1] && { order: s.files[1] }),
      ...(s.files[2] && { delivery: s.files[2] }),
    } as Partial<Record<Slot, string>> & { invoice: string },
  }));
