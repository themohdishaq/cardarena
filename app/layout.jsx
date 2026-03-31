import "./globals.css";

const BASE_URL = "https://bazargame.vercel.app";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Bazar Game – Real-Time 4-Player Card Game",
    template: "%s | Bazar Game",
  },
  description:
    "Bazar Game is a fast-paced, real-time multiplayer card game. No login, no install — jump in, match cards, steal wallets, and outlast your opponents.",
  keywords: [
    "bazar game",
    "bazar card game",
    "card game",
    "multiplayer card game",
    "online card game",
    "real-time card game",
    "free card game",
    "browser card game",
  ],
  authors: [{ name: "Bazar Game" }],
  creator: "Bazar Game",
  publisher: "Bazar Game",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Bazar Game",
    title: "Bazar Game – Real-Time 4-Player Card Game",
    description:
      "Jump into a fast-paced real-time card game. No login, no install. Match cards, steal wallets, and beat 3 opponents.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bazar Game – Real-Time Multiplayer Card Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bazar Game – Real-Time 4-Player Card Game",
    description:
      "Jump into a fast-paced real-time card game. No login, no install. Match cards, steal wallets, and beat 3 opponents.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  );
}
