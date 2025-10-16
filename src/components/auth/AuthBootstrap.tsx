// src/components/auth/AuthBootstrap.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function AuthBootstrap() {
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Initialize status bar
      if (typeof window !== "undefined" && (window as any).Capacitor?.isNative) {
        try {
          // Ensure the status bar is visible and doesn't overlay the webview
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });

          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: Style.Light });
          
          // Get safe area insets
          const info = await StatusBar.getInfo();
          const safeAreaTop = info.safeAreaTop ?? 0;
          const safeAreaBottom = info.safeAreaBottom ?? 0;
          
          // Set CSS variables
          document.documentElement.style.setProperty("--sat", `${safeAreaTop}px`);
          document.documentElement.style.setProperty("--sab", `${safeAreaBottom}px`);
        } catch (e) {
          console.error("StatusBar initialization failed:", e);
        }
      }

      // Existing auth logic
      await refreshUser();
      if (searchParams.get("login") === "success") {
        router.replace("/");
      }
    })();
  }, [refreshUser, searchParams, router]);

  return null;
}