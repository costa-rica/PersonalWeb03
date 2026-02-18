"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api/auth";
import LoadingOverlay from "@/components/LoadingOverlay";
import Modal from "@/components/ui/modal";
import ModalInformationOk from "@/components/ui/modal/ModalInformationOk";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validationSchemas";
import { logAuthEvent, logValidationFailure } from "@/lib/securityLogger";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // SECURITY: Log validation failures
  if (Object.keys(errors).length > 0) {
    const errorMessages: Record<string, string> = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (value?.message) errorMessages[key] = value.message;
    });
    
    logValidationFailure('/reset-password', errorMessages, getValues());
  }

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          "No reset token provided. Please use the link from your email.",
      });
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });

    // If success or no token error, redirect to login after closing modal
    if (modalState.type === "success" || !token) {
      router.push("/login");
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          "No reset token provided. Please use the link from your email.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(token, data.password);

      // SECURITY: Log successful password reset
      logAuthEvent('PASSWORD_RESET_SUCCESS', true, undefined, {
        hasToken: !!token,
      });

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: response.message,
      });
    } catch (err) {
      // SECURITY: Log failed password reset
      logAuthEvent('PASSWORD_RESET_SUCCESS', false, undefined, {
        error: err instanceof Error ? err.message : 'Unknown error',
        hasToken: !!token,
      });

      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to reset password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          {/* Back to Login Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-black transition-colors font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          {/* Form Container */}
          <div className="border-2 border-black rounded-lg p-8">
            <h1 className="text-2xl font-mono font-bold mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-gray-600 font-mono mb-6">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="font-mono pr-10"
                    disabled={isLoading || !token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-600 transition-colors"
                    disabled={isLoading || !token}
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

              <Button
                type="submit"
                className="w-full font-mono"
                disabled={isLoading || !token}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
      <Modal isOpen={modalState.isOpen} onClose={handleCloseModal}>
        <ModalInformationOk
          title={modalState.title}
          message={modalState.message}
          variant={modalState.type}
          onClose={handleCloseModal}
        />
      </Modal>
    </>
  );
}
