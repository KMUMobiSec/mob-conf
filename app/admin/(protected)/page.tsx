import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/qr-check-ins");
}
