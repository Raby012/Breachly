import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function isAdminUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.email === process.env.ADMIN_EMAIL;
}
