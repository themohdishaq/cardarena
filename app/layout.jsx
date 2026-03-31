import "./globals.css";

export const metadata = {
  title: "Card Arena",
  description: "Real-time 4-player card game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  );
}
