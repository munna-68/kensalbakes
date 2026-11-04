import { Footer, Header } from "@/components/site-chrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative">{children}</main>
      <Footer />
    </>
  );
}
