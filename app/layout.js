import "./globals.css";

export const metadata = {
  title: "Hanson's Mobile Mechanics | Webster City, IA",
  description: "Mobile mechanic service in Webster City, Iowa and within a 35 mile radius. General repairs, brakes, suspension, steering, oil changes, tire repair, minor electrical, vehicle unlocks and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
