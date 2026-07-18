import { redirect } from "next/navigation";

/** Portal entry — marketing lives on DevWeb / Vercel marketing project. */
export default function Home() {
  redirect("/login");
}
