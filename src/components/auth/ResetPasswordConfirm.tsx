"use client";

/**
 * Página de Confirmação de Redefinição de Senha
 * 
 * Fluxo:
 * 1. Usuário clica no link do email
 * 2. Insere nova senha
 * 3. Sistema atualiza a senha no backend
 */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon, CheckCircleIcon } from "@/icons";

// Validação com Zod
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(true);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Validar token quando a página carrega
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsCheckingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/validate-reset-token?token=${token}`
        );
        setIsValidToken(response.ok);
      } catch (err) {
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Erro ao redefinir senha");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Validando link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90 sm:text-title-lg">
              Link Expirado
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/reset-password">
              <Button className="w-full" size="sm">
                Solicitar Novo Link
              </Button>
            </Link>
            <Link href="/signin">
              <Button className="w-full" size="sm" variant="outline">
                Voltar ao Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90 sm:text-title-lg">
              Senha Redefinida!
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.
            </p>
          </div>

          <Link href="/signin">
            <Button className="w-full" size="sm">
              Ir para Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Voltar ao Login
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90 sm:text-title-lg">
            HB Track
          </h1>
          <h2 className="mb-2 font-medium text-gray-700 dark:text-gray-300 text-lg">
            Criar Nova Senha
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Digite uma nova senha segura para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <Label>
                Nova Senha <span className="text-error-500">*</span>{" "}
              </Label>
              <div className="relative">
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      disabled={isLoading}
                      onChange={field.onChange}
                      defaultValue={field.value}
                      error={!!errors.password}
                    />
                  )}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Confirmar Senha <span className="text-error-500">*</span>{" "}
              </Label>
              <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      disabled={isLoading}
                      onChange={field.onChange}
                      defaultValue={field.value}
                      error={!!errors.confirmPassword}
                    />
                  )}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Requisitos de senha:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                <li>Mínimo 8 caracteres</li>
                <li>Pelo menos uma letra maiúscula</li>
                <li>Pelo menos um número</li>
              </ul>
            </div>

            <Button
              className="w-full"
              size="sm"
              disabled={isLoading || !password}
              onClick={handleSubmit(onSubmit)}
            >
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
