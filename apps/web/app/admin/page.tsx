import { redirect } from "next/navigation";

export default async function AdminRootPage({
  searchParams
}: {
  searchParams: Promise<{ ui?: string }>;
}) {
  const { ui } = await searchParams;
  redirect(ui ? `/admin/products?ui=${ui}` : "/admin/products");
}
