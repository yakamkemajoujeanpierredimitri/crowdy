import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import DevAuthSwitcher from "@/components/DevAuthSwitcher";

export const metadata = {
  title: "CrowdSense | Real-Time Crowd Score Calibration",
  description: "Track live and historical busyness levels at cafes, gyms, parks, and retail stores with real-time updates.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <DevAuthSwitcher />
        </AuthProvider>
      </body>
    </html>
  );
}
