import type { Metadata, Viewport } from "next";
import { Tajawal, El_Messiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

const elMessiri = El_Messiri({
  variable: "--font-messiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "سَكِينَة",
  description:
    "تطبيق التأمل أثناء النوم و ASMR: مشاهد صوتية متكررة، خلاط أصوات بالموجات، قصص نوم طويلة، ومؤقت يتلاشى بلطف حتى الصمت.",
  keywords: ["نوم", "تأمل", "ASMR", "أصوات محيطة", "مؤقت نوم", "قصص نوم"],
  authors: [{ name: "سَكِينَة" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "سَكِينَة",
  },
};

export const viewport: Viewport = {
  themeColor: "#08161c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${elMessiri.variable} antialiased bg-background text-foreground min-h-svh overflow-x-hidden`}
      >
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  );
}
