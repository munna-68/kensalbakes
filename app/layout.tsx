import type { Metadata, Viewport } from "next";
import { Archivo, DM_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { SmoothScroll, Toaster, TransitionProvider } from "@/components/providers";
import Preloader from "@/components/Preloader";

// One variable grotesque does the whole job: condensed (wdth 62–68) for the
// poster type, normal width for UI. DM Mono is the typewriter body copy.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", weight: ["400", "500"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kensal Bakes · Cakes, cupcakes & cookies in Kensal Rise",
  description: "Made with love, for life's sweetest moments. A home bakery in Kensal Rise, London. (Demo site)",
};

export const viewport: Viewport = {
  themeColor: "#6b554c",
};

// Runs before first paint: enables motion styles and decides whether the preloader shows.
const bootScript = `(function(){try{var d=document.documentElement;var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r)d.classList.add('motion');if(r||sessionStorage.getItem('kb-preloaded')||location.pathname.indexOf('/dashboard')===0)d.classList.add('no-preloader');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className={`${archivo.variable} ${dmMono.variable} antialiased`}>
        <StoreProvider>
          <SmoothScroll />
          <TransitionProvider>
            {children}
            <Toaster />
          </TransitionProvider>
          <Preloader />
        </StoreProvider>
      </body>
    </html>
  );
}
