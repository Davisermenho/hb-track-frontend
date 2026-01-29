"use client";

/**
 * Formulário de Nova Senha
 * Fluxo:
 * 1. Usuário acessa via link com token: /new-password?token=xyz
 * 2. Preenche a nova senha (2 campos iguais)
 * 3. Envia para o backend e vê o resultado na mesma página
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, EyeCloseIcon, EyeIcon } from "@/icons";

// API URL do backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Validação com Zod
const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

function Header() {
  const { theme } = useTheme();
  const [mounted] = useState(true);

  return (
    <div className="text-center mb-6">
      {mounted ? (
        <div className="flex justify-center mb-2">
          <Image
            src={theme === "dark" ? "/images/logo/auth-logo-dark.svg" : "/images/logo/auth-logo.svg"}
            alt="HB Track"
            width={180}
            height={60}
            priority
          />
        </div>
      ) : (
        <div style={{ width: 180, height: 60 }} className="mx-auto mb-2" />
      )}
      <p
        className="text-sm text-gray-600 dark:text-gray-400"
        style={{ fontFamily: '"Inter", sans-serif', fontWeight: 300 }}
      >
        Dados que decidem jogos
      </p>
    </div>
  );
}

export default function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : "Token inválido. Por favor, solicite um novo link de recuperação."
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: NewPasswordFormData) => {
    if (!token) {
      setError("Token inválido");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Permite que o backend sete cookies HttpOnly
        body: JSON.stringify({
          token,
          new_password: data.password,
          confirm_password: data.confirmPassword,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.detail?.message || responseData.message || "Erro ao redefinir senha");
        setIsLoading(false);
        return;
      }

      // Backend já setou os cookies HttpOnly - redirecionar direto para /inicio
      // Não precisa de login manual!
      router.replace(responseData.redirect_to || "/inicio");
      router.refresh(); // Força AuthContext a reconhecer a sessão
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      setIsLoading(false);
    }
  };

  // Sucesso
  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-xs text-center">
          <Header />
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">
              Senha Alterada com Sucesso!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sua senha foi alterada com sucesso. Agora você pode fazer login usando seu email e a nova senha.
            </p>
          </div>

          <Button className="w-full" size="sm" onClick={() => router.push("/signin")}>
            Ir para o Login
          </Button>
        </div>
      </div>
    );
  }

  // Token ausente
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-xs text-center">
          <Header />
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Link inválido</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Token inválido. Solicite um novo link de recuperação.
            </p>
          </div>

          <Button className="w-full" size="sm" onClick={() => router.push("/reset-password")}>
            Solicitar Novo Link
          </Button>
        </div>
      </div>
    );
  }

  // Formulário principal
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-xs">
        <Header />
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Definir Nova Senha</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Digite sua nova senha nos campos abaixo. As senhas devem ser idênticas.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error-700 dark:text-error-400 bg-error-100 dark:bg-error-950/30 rounded-lg border border-error-300 dark:border-error-800">
                {error}
              </div>
            )}

            {/* Nova Senha */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300 mb-2 block">
                Nova Senha <span className="text-error-500">*</span>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeCloseIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300 mb-2 block">
                Confirmar Senha <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita sua nova senha"
                      disabled={isLoading}
                      onChange={field.onChange}
                      defaultValue={field.value}
                      error={!!errors.confirmPassword}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeIcon className="w-5 h-5" /> : <EyeCloseIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button className="w-full" size="sm" disabled={isLoading} onClick={handleSubmit(onSubmit)}>
              {isLoading ? "Processando..." : "Definir Nova Senha"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
