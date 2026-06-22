import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismiss = () => setVisible(false);

    const maxTimer = setTimeout(dismiss, 800);
    const minTimer = setTimeout(() => {
      if (document.readyState === "complete") {
        dismiss();
      } else {
        window.addEventListener("load", dismiss, { once: true });
      }
    }, 250);

    return () => {
      clearTimeout(maxTimer);
      clearTimeout(minTimer);
      window.removeEventListener("load", dismiss);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0.98_0.015_85)]"
      aria-hidden="true"
    >
      <BrandLogo className="splash-logo h-28 w-28 object-contain" />
    </div>
  );
}
