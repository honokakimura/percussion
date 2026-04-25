import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "打楽器 運搬申請",
  description: "吹奏楽部 打楽器 運搬申請メッセージ作成ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${notoSansJP.variable} font-sans bg-zinc-50 text-zinc-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}