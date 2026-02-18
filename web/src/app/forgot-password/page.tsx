"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api/auth";
import LoadingOverlay from "@/components/LoadingOverlay";
import Modal from "@/components/ui/modal";
import ModalInformationOk from "@/components/ui/modal/ModalInformationOk";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validationSchemas";
import { logAuthEvent, logValidationFailure } from "@/lib/securityLogger";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
    reset,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // SECURITY: Log validation failures
  if (Object.keys(errors).length > 0) {
    const errorMessages: Record<string, string> = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (value?.message) errorMessages[key] = value.message;
    });
    
    logValidationFailure('/forgot-password', errorMessages, getValues());
  }

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });

    // If success, redirect to login after closing modal
    if (modalState.type === "success") {
      router.push("/login");
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await forgotPassword(data.email);

      // SECURITY: Log password reset request
      logAuthEvent('PASSWORD_RESET_REQUEST', true, data.email);

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: response.message,
      });
      reset();
    } catch (err) {
      // SECURITY: Log failed password reset request
      logAuthEvent('PASSWORD_RESET_REQUEST', false, data.email, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to send reset email",
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
              Forgot Password
            </h1>
            <p className="text-sm text-gray-600 font-mono mb-6">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

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
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 font-mono">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-mono"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
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
