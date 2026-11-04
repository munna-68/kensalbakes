import { Suspense } from "react";
import Order from "@/components/order";

export const metadata = { title: "Order & enquire · Kensal Bakes" };

export default function Page() {
  return (
    <Suspense>
      <Order />
    </Suspense>
  );
}
