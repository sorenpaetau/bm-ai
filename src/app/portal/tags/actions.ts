"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createBatch, isUuid, MAX_BATCH_QUANTITY, moveBatch, productBelongsTo, setTagActive } from "@/lib/tags";

export type FormState = { error?: string };

const NewBatch = z.object({
  productId: z.string().refine((v) => v === "" || isUuid(v), "Choose a product"),
  quantity: z.coerce
    .number({ message: "Enter how many tags you need" })
    .int("Enter a whole number")
    .min(1, "Make at least 1 tag")
    .max(MAX_BATCH_QUANTITY, `Make up to ${MAX_BATCH_QUANTITY.toLocaleString()} tags at a time`),
  label: z.string().trim().max(80, "Keep the name under 80 characters"),
  tagType: z.enum(["standard", "custom_print", "wet_inlay"]),
});

export async function createBatchAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = NewBatch.safeParse({
    productId: form.get("productId") ?? "",
    quantity: form.get("quantity"),
    label: form.get("label") ?? "",
    tagType: form.get("tagType") ?? "standard",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };

  const { productId, quantity, label, tagType } = parsed.data;
  if (productId && !(await productBelongsTo(user.companyId, productId))) return { error: "Choose a product" };

  const batchId = await createBatch({
    companyId: user.companyId,
    productId: productId || null,
    quantity,
    label: label || null,
    tagType,
  });
  revalidatePath("/portal/tags");
  redirect(`/portal/tags/${batchId}?created=1`);
}

export async function moveBatchAction(batchId: string, form: FormData) {
  const user = await requireUser();
  const productId = String(form.get("productId") ?? "");
  if (!isUuid(batchId)) return;
  if (productId && !(await productBelongsTo(user.companyId, productId))) return;
  await moveBatch(user.companyId, batchId, productId || null);
  revalidatePath(`/portal/tags/${batchId}`);
  revalidatePath("/portal/tags");
}

export async function setTagActiveAction(batchId: string, code: string, active: boolean) {
  const user = await requireUser();
  await setTagActive(user.companyId, code, active);
  revalidatePath(`/portal/tags/${batchId}`);
}
