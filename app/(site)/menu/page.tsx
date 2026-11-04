import { Suspense } from "react";
import Menu from "@/components/menu";

export const metadata = { title: "Menu · Kensal Bakes" };

export default function Page() {
  return (
    <Suspense>
      <Menu />
    </Suspense>
  );
}
