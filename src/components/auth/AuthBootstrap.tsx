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
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initialize = async () => {
      try {
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

        // Set a timeout for the refreshUser call
        const refreshPromise = refreshUser();
        
        // Create a timeout that will reject after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            if (isMounted) {
              console.warn('Refresh user timed out after 10 seconds');
              reject(new Error('Request timeout'));
            }
          }, 10000);
        });

        // Race between the refresh and the timeout
        await Promise.race([refreshPromise, timeoutPromise]);

        if (isMounted && searchParams.get("login") === "success") {
          router.replace("/");
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        // Continue with the app even if refresh fails
      } finally {
        if (isMounted) {
          // Any cleanup or state updates can go here
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refreshUser, searchParams, router]);

  return null;
}