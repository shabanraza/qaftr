import { useEffect, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import type { MarketingLang } from "#/lib/marketing/lang";
import { langDir } from "#/lib/marketing/lang";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";

type AuthGateDialogProps = {
  lang?: MarketingLang;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: "signup" | "signin";
  context?: "invoice" | "general";
};

export function AuthGateDialog({
  lang = "ar",
  open,
  onClose,
  onSuccess,
  initialMode = "signup",
  context = "invoice",
}: AuthGateDialogProps) {
  const copy = getInstantInvoiceCopy(lang);
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
  }, [initialMode, open]);

  const generalCopy =
    lang === "ar"
      ? {
          title: mode === "signup" ? "أنشئ حسابك في قافتر" : "سجّل الدخول إلى قافتر",
          body:
            mode === "signup"
              ? "احفظ فواتيرك، افتح مكتب المال، وارجع لعملائك لاحقاً من أي جهاز."
              : "ادخل إلى حسابك لمتابعة الفواتير والعملاء والتحصيل.",
          continueWithout: "إغلاق",
        }
      : {
          title: mode === "signup" ? "Create your Qaftr account" : "Sign in to Qaftr",
          body:
            mode === "signup"
              ? "Save invoices, open your money desk, and come back to clients from any device."
              : "Sign in to continue with invoices, clients, and collections.",
          continueWithout: "Close",
        };

  const dialogCopy =
    context === "general"
      ? {
          ...copy.auth,
          title: generalCopy.title,
          body: generalCopy.body,
          continueWithout: generalCopy.continueWithout,
      }
      : copy.auth;
  const loadingCopy =
    mode === "signup"
      ? copy.auth.saving
      : lang === "ar"
        ? "جاري الدخول…"
        : "Signing in…";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "User",
        });
        if (result.error) {
          setError(result.error.message ?? copy.errors.INTERNAL_ERROR);
          return;
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? copy.errors.INTERNAL_ERROR);
          return;
        }
      }
      onSuccess();
    } catch {
      setError(copy.errors.INTERNAL_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        dir={langDir(lang)}
        lang={lang}
        className="qaftr-marketing border-border bg-card font-[family-name:var(--font-qaftr-body)] text-foreground sm:max-w-md"
        showCloseButton
      >
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle className="font-[family-name:var(--font-qaftr-display)] text-xl leading-snug text-foreground">
            {dialogCopy.title}
          </DialogTitle>
          <DialogDescription className="leading-6 text-muted-foreground">
            {dialogCopy.body}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            {mode === "signup" ? (
              <Field>
                <FieldLabel htmlFor="auth-name" className="text-sm font-medium text-foreground">
                  {dialogCopy.name}
                </FieldLabel>
                <Input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="auth-email" className="text-sm font-medium text-foreground">
                {dialogCopy.email}
              </FieldLabel>
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                dir="ltr"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="auth-password" className="text-sm font-medium text-foreground">
                {dialogCopy.password}
              </FieldLabel>
              <Input
                id="auth-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                dir="ltr"
              />
            </Field>

            {error ? <FieldError>{error}</FieldError> : null}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? <Spinner data-icon="inline-start" /> : null}
              {loading
                ? loadingCopy
                : mode === "signup"
                  ? dialogCopy.signUp
                  : dialogCopy.signIn}
            </Button>
          </FieldGroup>
        </form>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            variant="link"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? dialogCopy.haveAccount : dialogCopy.noAccount}{" "}
            {mode === "signup" ? dialogCopy.signIn : dialogCopy.signUp}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {dialogCopy.continueWithout}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
