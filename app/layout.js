import "./globals.css";

export const metadata = {
  title: "Hanson's Mobile Mechanics | Webster City, IA",
  description: "Mobile mechanic service in Webster City, Iowa and within a 35 mile radius. General repairs, brakes, suspension, steering, oil changes, tire repair, minor electrical, vehicle unlocks and more.",
  manifest: "/manifest.webmanifest",
  themeColor: "#c9141e",
  appleWebApp: {
    capable: true,
    title: "Hanson Mechanics",
    statusBarStyle: "black-translucent"
  },
  icons: { icon: "/hanson-official-logo.svg", shortcut: "/hanson-official-logo.svg", apple: "/hanson-logo.jpg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
