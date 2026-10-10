import type { Metadata } from "next";
import "./globals.css";
import Shell from "../components/saassum/Shell";
export const metadata: Metadata = {
  title: "Airctrl — A more natural way to control",
  description:
    "A hands-free workspace for gestures, voice, and a more personal way to interact with your computer.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
