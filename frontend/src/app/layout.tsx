import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Healthcare Referral System",
  description: "Patient referral management platform for the Greater Accra region",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Google Maps JS API — key loaded at runtime from backend */}
        <Script
          id="google-maps-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (async function() {
                try {
                  const res = await fetch('http://localhost:8000/api/maps-key');
                  const data = await res.json();
                  if (data.key) {
                    const script = document.createElement('script');
                    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + data.key + '&libraries=places&callback=Function.prototype';
                    script.async = true;
                    document.head.appendChild(script);
                    window.__GOOGLE_MAPS_KEY = data.key;
                  }
                } catch(e) { console.warn('Google Maps API key not available:', e); }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
