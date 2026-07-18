import { InstallHome } from "@/components/InstallHome";
import { AuthProvider } from "@/lib/auth";

/** Local install / health check page (Docker Compose). */
export default function InstallPage() {
  return (
    <AuthProvider>
      <InstallHome />
    </AuthProvider>
  );
}
