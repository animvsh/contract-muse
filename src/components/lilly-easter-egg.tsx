import { Heart } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Step = null | "wallahi" | "phonepass" | "reveal";

export function LillyEasterEgg() {
  const [step, setStep] = useState<Step>(null);
  const [wallahi, setWallahi] = useState("");
  const [phonePass, setPhonePass] = useState("");
  const [running, setRunning] = useState(false);

  const close = () => {
    setStep(null);
    setWallahi("");
    setPhonePass("");
  };

  const triggerStickman = () => {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setStep("wallahi");
    }, 4200);
  };

  return (
    <>
      <style>{`
        @keyframes stickman-run {
          0%   { transform: translate(0, 120%); }
          15%  { transform: translate(0, -30%); }
          25%  { transform: translate(0, -10%); }
          40%  { transform: translate(-90vw, -10%) scaleX(-1); }
          55%  { transform: translate(-90vw, -10%) scaleX(-1); }
          70%  { transform: translate(0, -10%) scaleX(1); }
          85%  { transform: translate(0, -40%) scaleX(1); }
          100% { transform: translate(0, 120%) scaleX(1); }
        }
        @keyframes stickman-bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-6px) rotate(3deg); }
        }
      `}</style>

      {running && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] h-32 overflow-visible">
          <div
            className="absolute bottom-2 right-6 origin-bottom"
            style={{ animation: "stickman-run 4.2s cubic-bezier(.4,0,.4,1) forwards" }}
          >
            <div style={{ animation: "stickman-bob 0.45s ease-in-out infinite" }}>
              {/* Sign */}
              <div className="mb-1 ml-6 -rotate-6 rounded-md border-2 border-foreground bg-background px-3 py-1.5 text-[11px] font-black text-pink-600 dark:text-pink-400 shadow-lg">
                hi triv ily 💕
              </div>
              {/* Stickman SVG */}
              <svg width="40" height="64" viewBox="0 0 40 64" className="ml-2 text-foreground">
                <circle cx="20" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <path d="M16 10 Q20 13 24 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <line x1="20" y1="16" x2="20" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="22" x2="6" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="22" x2="32" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="38" x2="10" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="38" x2="32" y2="56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="group relative inline-flex">
        <button
          onClick={triggerStickman}
          className="clicky-sm rounded-full p-2 text-pink-400/70 transition-colors hover:bg-pink-500/10 hover:text-pink-500"
          aria-label="lilly"
        >
          <Heart size={18} />
        </button>
        <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[220px] rounded-lg bg-foreground px-3 py-2 text-[11px] font-medium text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          this is only for lilly lovers, is that u?
          <div className="mt-1.5 flex justify-end gap-1.5 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); close(); }}
              className="rounded-md bg-background/10 px-2 py-0.5 text-[10px] hover:bg-background/20"
            >no</button>
            <button
              onClick={(e) => { e.stopPropagation(); triggerStickman(); }}
              className="rounded-md bg-pink-500 px-2 py-0.5 text-[10px] font-bold hover:bg-pink-400"
            >yes</button>
          </div>
        </div>
      </div>

      {/* Step 1: wallahi */}
      <Dialog open={step === "wallahi"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>say wallahi rn 🤨</DialogTitle>
            <DialogDescription>type it. exactly.</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={wallahi}
            onChange={(e) => setWallahi(e.target.value)}
            placeholder="wallahi"
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30"
          />
          {wallahi.trim().toLowerCase() === "wallahi" && (
            <p className="text-center text-sm font-bold text-pink-600 dark:text-pink-400">say pakka pakka 💅</p>
          )}
          <DialogFooter>
            <button
              onClick={() => setStep("phonepass")}
              className="clicky-sm w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
            >
              brodigi just lemme see
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: phone password */}
      <Dialog open={step === "phonepass"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>her phone password 🔐</DialogTitle>
            <DialogDescription>if you know, you know.</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={phonePass}
            onChange={(e) => setPhonePass(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 text-center text-sm tracking-[0.3em] outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30"
          />
          {phonePass === "021414" && (
            <p className="text-center text-sm font-bold text-pink-600 dark:text-pink-400">unlocked 💅</p>
          )}
          <DialogFooter>
            <button
              disabled={phonePass !== "021414"}
              onClick={() => setStep("reveal")}
              className="clicky-sm w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              unlock nooshmesh
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 3: reveal */}
      <Dialog open={step === "reveal"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>well here it is 🎁</DialogTitle>
            <DialogDescription>made just for u</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <a
              href="https://nooshmesh.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="clicky-sm block w-full rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 px-4 py-3 text-center text-sm font-bold text-white hover:opacity-90"
            >
              ✨ nooshmesh adventures ✨
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
