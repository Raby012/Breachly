import "./globals.css";

export const metadata = {
  title: "Breachly — AI Security Scanner",
  description: "Apni site hack hone se pehle pakdo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
