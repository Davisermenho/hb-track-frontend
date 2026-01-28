"use client";

/**
 * Formulário de Recuperação de Senha
 * Layout alinhado ao Login (logo, fundo, tipografia e campos).
 */

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

// API URL do backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Validação com Zod
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.detail?.message || responseData.message || "Erro ao enviar email de recuperação");
        setIsLoading(false);
        return;
      }

      router.push("/signin?reset=success");
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-xs">
        {/* Header com logo e tagline (igual login) */}
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {error && (
            <div className="p-3 text-xs text-error-700 dark:text-error-400 bg-error-100 dark:bg-error-950/30 rounded-lg border border-error-300 dark:border-error-800">
              {error}
            </div>
          )}

          {/* Campo de email (mesmo estilo do login) */}
          <div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    bg-white dark:bg-[#2a3441]
                    text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:outline-hidden focus:ring-2 focus:ring-blue-500/30
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      errors.email
                        ? "border-error-500"
                        : "border-gray-300 dark:border-gray-700 focus:border-blue-500"
                    }
                  `}
                  placeholder="Email"
                />
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Botão (estilo login) */}
          <button
            type="submit"
            disabled={isLoading || !!errors.email}
            className={`
              w-full py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                !errors.email && !isLoading
                  ? "bg-gray-400 hover:bg-gray-500 dark:bg-[#4a5568] dark:hover:bg-[#5a6578] text-white"
                  : "bg-gray-300 dark:bg-[#3a4452] text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? "Enviando..." : "Enviar e-mail para redefinir a senha"}
          </button>

          <div className="text-center pt-1">
            <a
              href="/signin"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Voltar ao login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
