import "./globals.css";

export const metadata = {
  title: "Hanson Mobile Mechanics",
  description: "Simple, convenient mobile mechanic service brought to you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
