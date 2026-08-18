import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package2,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  title = "Sign in to ShipLync",
  subtitle = "Access instant shipment booking, live GPS tracking, and automated AI dispatch.",
  compact = false,
}) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"phone" | "email">("phone");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("9876543210");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(["4", "8", "2", "9", "1", "0"]);
  const [resendTimer, setResendTimer] = useState(30);

  // Email state
  const [email, setEmail] = useState("aditi.kapoor@example.com");
  const [password, setPassword] = useState("••••••••••••");
  const [name, setName] = useState("Aditi Kapoor");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpStep(true);
      setResendTimer(30);
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login({ phone: `+91 ${phone}` });
      if (onSuccess) onSuccess();
    }, 700);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login({
        email,
        name: mode === "signup" ? name : email.split("@")[0].replace(".", " "),
      });
      if (onSuccess) onSuccess();
    }, 700);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login({
        email: `user.${provider.toLowerCase()}@shiplync.com`,
        name: `${provider} Account`,
      });
      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <div className={`w-full ${compact ? "" : "max-w-md mx-auto"}`}>
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground shadow-md mb-1">
          <Package2 className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {mode === "login" ? title : "Create your ShipLync Account"}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Mode Switcher Banner */}
      <div className="bg-muted/60 p-1 rounded-xl flex mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setOtpStep(false);
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            mode === "login"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setOtpStep(false);
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            mode === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Account
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-5">
          <TabsTrigger value="phone" className="text-xs flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Mobile OTP
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email Address
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Mobile Phone & OTP */}
        <TabsContent value="phone" className="space-y-4">
          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone-number" className="text-xs">Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-3 border rounded-md bg-muted/40 text-xs font-medium text-muted-foreground shrink-0">
                    <span>🇮🇳 +91</span>
                  </div>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    required
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Instant 6-digit verification code will be sent via SMS for quick one-tap access.</span>
              </div>

              <Button type="submit" className="w-full gap-2 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...
                  </>
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Code sent to +91 {phone}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter the 6-digit verification code below:
                </p>
              </div>

              <div className="flex justify-center gap-2 my-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[idx] = e.target.value;
                      setOtp(newOtp);
                    }}
                    className="w-10 h-12 text-center text-lg font-mono font-semibold rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  Change phone number
                </button>
                <span>Resend code in <strong className="text-foreground">{resendTimer}s</strong></span>
              </div>

              <Button type="submit" className="w-full gap-2 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Verify & Proceed <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </TabsContent>

        {/* Tab 2: Email & Password */}
        <TabsContent value="email" className="space-y-4">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="email-name" className="text-xs">Full Name</Label>
                <Input
                  id="email-name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">Password</Label>
                {mode === "login" && (
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] text-primary hover:underline font-medium">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" defaultChecked />
                <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                  Remember this device for 30 days
                </Label>
              </div>
            )}

            <Button type="submit" className="w-full gap-2 font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In to Account" : "Create ShipLync Account"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
          <span className="bg-background px-3 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("Google")}
          disabled={isLoading}
          className="text-xs gap-2 font-medium h-10"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin("Apple")}
          disabled={isLoading}
          className="text-xs gap-2 font-medium h-10"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.95.99-3.09-1 .04-2.17.67-2.88 1.5-.64.74-1.19 1.9-1.04 3.04 1.11.09 2.25-.62 2.93-1.45z" />
          </svg>
          Apple ID
        </Button>
      </div>

      <div className="mt-6 pt-4 border-t text-center text-[11px] text-muted-foreground">
        By proceeding, you agree to ShipLync's{" "}
        <a href="#terms" onClick={(e) => e.preventDefault()} className="underline hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#privacy" onClick={(e) => e.preventDefault()} className="underline hover:text-foreground">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
};
