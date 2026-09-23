import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bus, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginFn, getCurrentUserFn } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    try {
      const user = await getCurrentUserFn();
      if (user) {
        throw redirect({ to: "/" });
      }
    } catch (err: any) {
      // Re-throw redirect exceptions to let router navigate
      if (err?.message === "Redirect" || err?.status === 302 || err?.status === 307) {
        throw err;
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Sign In — TransitOS" },
      { name: "description", content: "Sign in to your TransitOS account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginFn({ data: { email, password } });
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name || "User"}!`);
        // Invalidate router context to load the user info
        await router.invalidate();
        // Redirect to dashboard
        await router.navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top_right,var(--color-accent),transparent_45%)]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bus className="size-6 animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            TransitOS
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Intelligent Transport Operations Platform
          </p>
        </div>

        <div className="panel p-6 sm:p-8 bg-card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => toast.info("Contact system administrator to reset password.")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <Label htmlFor="remember-me" className="text-xs text-muted-foreground select-none cursor-pointer">
                  Remember my session
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">
              Quick Demo Logins (password: password123)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "System Admin", email: "admin@salemtransport.demo" },
                { label: "Scheduler", email: "scheduler@salemtransport.demo" },
                { label: "Depot Manager", email: "depot@salemtransport.demo" },
                { label: "Route Planner", email: "planner@salemtransport.demo" },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("password123");
                    toast.info(`Filled ${account.label} credentials`);
                  }}
                  className="rounded-lg border border-border/80 bg-background/50 hover:bg-muted/70 hover:border-primary/40 px-2.5 py-1.5 text-left text-xs transition-colors flex flex-col cursor-pointer"
                >
                  <span className="font-semibold text-foreground text-[11px]">{account.label}</span>
                  <span className="font-mono text-[9px] text-muted-foreground truncate">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Demo Build · Local PostgreSQL Authentication
        </div>
      </div>
    </div>
  );
}
