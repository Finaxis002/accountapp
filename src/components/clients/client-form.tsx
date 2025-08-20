"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

interface ClientFormProps {
  client?: Client;
  onFormSubmit?: () => void;
}

const baseSchema = z.object({
  contactName: z.string().min(2, "Contact name must be at least 2 characters."),
  clientUsername: z
    .string()
    .min(4, "Username must be at least 4 characters.")
    .max(24, "Username must be at most 24 characters.")
    .regex(
      /^[a-z0-9_.]+$/,
      "Use only lowercase letters, numbers, dot or underscore."
    ),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
  maxCompanies: z.coerce.number().min(0, "Must be a non-negative number."),
  maxUsers: z.coerce.number().min(0, "Must be a non-negative number."),
  canSendInvoiceEmail: z.boolean(),
  canSendInvoiceWhatsapp: z.boolean(),
});

const createClientSchema = baseSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters."),
  validityAmount: z.coerce
    .number()
    .int()
    .positive("Enter a positive number.")
    .max(1200, "That’s a bit long — try ≤ 1200."),
  validityUnit: z.enum(["days", "months", "years"]),
});

// For updates, we use the base schema which doesn't include the password.
const updateClientSchema = baseSchema;

type CreateClientForm = z.infer<typeof createClientSchema>;
type UpdateClientForm = z.infer<typeof updateClientSchema>;

export function ClientForm({ client, onFormSubmit }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [eyeOpen, setEyeOpen] = React.useState(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuthToken(localStorage.getItem("token"));
  }, []);

  // --- helpers ---
  function slugifyUsername(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9_.]+/g, "")
      .slice(0, 24);
  }

  function localSuggestions(base: string, tried?: string) {
    const core = slugifyUsername(base) || "user";
    const y = new Date().getFullYear().toString();
    const seeds = [
      core,
      `${core}1`,
      `${core}123`,
      `${core}${y.slice(-2)}`,
      `${core}${y}`,
      `${core}_official`,
      `${core}_hq`,
      `real${core}`,
      `${core}_co`,
      `${core}_app`,
    ];
    const out = Array.from(new Set(seeds))
      .filter((s) => s && s !== tried)
      .slice(0, 6);
    return out;
  }

  // --- state for availability UX ---
  const [checkingUsername, setCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<
    boolean | null
  >(null);
  const [usernameSuggestions, setUsernameSuggestions] = React.useState<
    string[]
  >([]);

  const formSchema = client ? updateClientSchema : createClientSchema;

  const form = useForm<CreateClientForm | UpdateClientForm>({
    resolver: zodResolver(client ? updateClientSchema : createClientSchema),
    defaultValues: {
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      email: client?.email || "",
      phone: client?.phone || "",
      maxCompanies: client?.maxCompanies || 5,
      maxUsers: client?.maxUsers || 10,
      canSendInvoiceEmail: client?.canSendInvoiceEmail ?? false,
      canSendInvoiceWhatsapp: client?.canSendInvoiceWhatsapp ?? false,
      ...(!client && {
        password: "",
        validityAmount: 30,
        validityUnit: "days",
      }),
    },
  });

  React.useEffect(() => {
    form.reset({
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      email: client?.email || "",
      phone: client?.phone || "",
      maxCompanies: client?.maxCompanies || 5,
      maxUsers: client?.maxUsers || 10,
      canSendInvoiceEmail: client?.canSendInvoiceEmail || false,
      canSendInvoiceWhatsapp: client?.canSendInvoiceWhatsapp || false,
      ...(!client && {
        password: "",
        validityAmount: 30,
        validityUnit: "days",
      }),
    });
  }, [client, form]);

  const watchedUsername = form.watch("clientUsername");
  const watchedContact = form.watch("contactName");

  React.useEffect(() => {
    // If editing, username field is disabled; mark as valid and skip checks.
    if (client) {
      setUsernameAvailable(true);
      setUsernameSuggestions([]);
      form.clearErrors("clientUsername");
      return;
    }

    const raw = (watchedUsername || "").trim().toLowerCase();

    // No value -> reset
    if (!raw) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      form.clearErrors("clientUsername");
      return;
    }

    // If it fails local regex/length, show suggestions from contact & don’t call API
    if (!/^[a-z0-9_.]{4,24}$/.test(raw)) {
      setUsernameAvailable(false);
      setUsernameSuggestions(localSuggestions(watchedContact || raw, raw));
      form.setError("clientUsername", {
        type: "manual",
        message:
          "Use 4–24 chars: lowercase letters, numbers, dot or underscore.",
      });
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setCheckingUsername(true);
        setUsernameAvailable(null);

        const params = new URLSearchParams({
          username: raw,
          base: watchedContact || raw,
        });
        // If you made it protected, add Authorization header here.
        const res = await fetch(
          `${baseURL}/api/clients/check-username?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.ok) {
          // don’t block user on transient errors
          setUsernameAvailable(null);
          setUsernameSuggestions([]);
          form.clearErrors("clientUsername");
          return;
        }

        if (data.available) {
          setUsernameAvailable(true);
          setUsernameSuggestions([]);
          form.clearErrors("clientUsername");
        } else {
          setUsernameAvailable(false);
          setUsernameSuggestions(
            (data.suggestions?.length
              ? data.suggestions
              : localSuggestions(watchedContact || raw, raw)
            ).slice(0, 6)
          );
          form.setError("clientUsername", {
            type: "manual",
            message: "Username already taken. Try a suggestion below.",
          });
        }
      } catch {
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
        form.clearErrors("clientUsername");
      } finally {
        setCheckingUsername(false);
      }
    }, 400); // debounce 400ms

    return () => {
      controller.abort();
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedUsername, watchedContact, client?._id]);

  function applyServerErrorsToForm(message: string) {
    const lower = message.toLowerCase();

    // access current values for generating suggestions
    const vals = form.getValues() as any;
    const tried = vals?.clientUsername || "";
    const base = vals?.contactName || tried;

    if (lower.includes("username")) {
      form.setError(
        "clientUsername",
        {
          type: "server",
          message: "Username already exists",
        },
        { shouldFocus: true }
      );

      // 👉 show suggestions immediately (even if the live checker didn’t run)
      setUsernameAvailable(false);
      setUsernameSuggestions(localSuggestions(base, tried));
      return true;
    }

    if (lower.includes("email")) {
      form.setError(
        "email",
        { type: "server", message: "Email already exists" },
        { shouldFocus: true }
      );
      return true;
    }

    if (lower.includes("phone")) {
      form.setError(
        "phone",
        { type: "server", message: "Phone already exists" },
        { shouldFocus: true }
      );
      return true;
    }

    return false;
  }

  function addToDate(
    d: Date,
    amount: number,
    unit: "days" | "months" | "years"
  ) {
    const copy = new Date(d);
    if (unit === "days") copy.setDate(copy.getDate() + amount);
    if (unit === "months") copy.setMonth(copy.getMonth() + amount);
    if (unit === "years") copy.setFullYear(copy.getFullYear() + amount);
    return copy;
  }

  // Preview (create mode only)
  const watchedAmt = form.watch("validityAmount" as any);
  const watchedUnit = form.watch("validityUnit" as any);
  const expiryPreview = React.useMemo(() => {
    if (client) return null;
    const amt = Number(watchedAmt);
    const unit = watchedUnit as "days" | "months" | "years" | undefined;
    if (!amt || !unit) return null;
    const dt = addToDate(new Date(), amt, unit);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(dt);
  }, [client, watchedAmt, watchedUnit]);

 async function onSubmit(values: z.infer<typeof formSchema>) {
  setIsSubmitting(true);

  const token = localStorage.getItem("token");
  if (!token) {
    toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to perform this action." });
    setIsSubmitting(false);
    return;
  }

  try {
    const valid = await form.trigger();
    if (!valid) { setIsSubmitting(false); return; }

    const url = client ? `${baseURL}/api/clients/${client._id}` : `${baseURL}/api/clients`;
    const method = client ? "PATCH" : "POST";

    // 🔑 shape the body
    let body: any = { ...values };
    if (!client) {
      body.validity = {
        amount: (values as any).validityAmount,
        unit:   (values as any).validityUnit, // "days" | "months" | "years"
      };
      delete body.validityAmount;
      delete body.validityUnit;
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const msg = data?.message || "Failed to save";
      applyServerErrorsToForm(msg);
      toast({ variant: "destructive", title: "Operation Failed", description: msg });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: `Client ${client ? "Updated" : "Created"}!`,
      description: `${values.contactName}'s details have been successfully saved.`,
    });
    onFormSubmit?.();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Something went wrong.";
    applyServerErrorsToForm(msg);
    toast({ variant: "destructive", title: "Operation Failed", description: msg });
  } finally {
    setIsSubmitting(false);
  }
}


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <ScrollArea className="flex-1 ">
          <div className="space-y-6 px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g. johndoe"
                          {...field}
                          disabled={!!client}
                          onChange={(e) => {
                            // force lowercase and strip spaces as user types
                            const val = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "");
                            field.onChange(val);
                          }}
                        />
                        {!client && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {checkingUsername && <span>checking…</span>}
                            {usernameAvailable === true &&
                              !checkingUsername && (
                                <span className="text-green-600">
                                  available ✓
                                </span>
                              )}
                            {usernameAvailable === false &&
                              !checkingUsername && (
                                <span className="text-red-600">taken ✗</span>
                              )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />

                    {!client && usernameSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {usernameSuggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              form.setValue("clientUsername", s, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            className="text-xs rounded-full border px-3 py-1 hover:bg-muted"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {!client &&
                      usernameAvailable === true &&
                      !checkingUsername && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Nice! This username is available.
                        </p>
                      )}
                  </FormItem>
                )}
              />
            </div>

            {!client && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={eyeOpen ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setEyeOpen((prev) => !prev)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                        >
                          {eyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-medium mb-4">
                Permissions & Limits
              </h3>
              <div className="space-y-4">
                {!client && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-base font-medium mb-4">
                        Account Validity
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={"validityAmount" as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="e.g. 30"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={"validityUnit" as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                  {...field}
                                >
                                  <option value="days">Days</option>
                                  <option value="months">Months</option>
                                  <option value="years">Years</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="sm:col-span-3">
                          {expiryPreview && (
                            <p className="text-xs text-muted-foreground">
                              This account will expire on{" "}
                              <span className="font-medium">
                                {expiryPreview}
                              </span>
                              .
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxCompanies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Companies</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Users</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="canSendInvoiceEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Send Invoice via Email</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow this client to send invoices to their customers
                          via email.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canSendInvoiceWhatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Send Invoice via WhatsApp</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow this client to send invoices via WhatsApp
                          integration.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end p-6 border-t bg-background">
          <Button
            type="submit"
            disabled={
              !authToken || // <-- block if no token yet
              isSubmitting ||
              checkingUsername ||
              (!client && usernameAvailable === false)
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? "Save Changes" : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
