import { AuthGuard } from "@/features/auth";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AuthGuard>{children}</AuthGuard>;
}
