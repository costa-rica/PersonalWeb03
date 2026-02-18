"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/lib/api/auth";
import { useAppDispatch } from "@/lib/hooks";
import { setUser } from "@/lib/features/userSlice";
import { loginSchema, type LoginFormData } from "@/lib/validationSchemas";
import { logAuthEvent, logValidationFailure } from "@/lib/securityLogger";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // SECURITY: Log validation failures
  if (Object.keys(errors).length > 0) {
    const errorMessages: Record<string, string> = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (value?.message) errorMessages[key] = value.message;
    });
    
    logValidationFailure('/login', errorMessages, getValues());
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(data);

      // SECURITY: Log successful authentication
      logAuthEvent('AUTHENTICATION_SUCCESS', true, data.email);

      // Store token and email in Redux
      dispatch(
        setUser({
          email: data.email,
          token: response.access_token,
        })
      );

      // Redirect to home
      router.push("/");
    } catch (err) {
      // SECURITY: Log failed authentication
      logAuthEvent('AUTHENTICATION_FAILURE', false, data.email, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border-2 border-black rounded-lg p-8">
        <h1 className="text-2xl font-mono font-bold mb-6">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="font-mono"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600 font-mono">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="font-mono pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 font-mono">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 border-2 border-red-600 bg-red-50">
              <p className="text-sm text-red-600 font-mono">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-mono"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-mono text-gray-700 hover:text-black transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
