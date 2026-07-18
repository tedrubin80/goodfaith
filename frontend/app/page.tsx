import { InstallHome } from "@/components/InstallHome";
import { AuthProvider } from "@/lib/auth";

/** Portal entry — branded home with sign-in. Install/health also at /install. */
export default function Home() {
  return (
    <AuthProvider>
      <InstallHome />
    </AuthProvider>
  );
}
