"use client";
/* eslint-disable react-hooks/incompatible-library */

/**
 * Formulário de Login redesenhado
 * - Dark/Light mode support
 * - Sporty typography (Bebas Neue)
 * - Professional animations
 * - Form validation with React Hook Form + Zod
 */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EyeIcon, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

// Validação com Zod
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { login, isLoading } = useAuth();
  const { theme } = useTheme();

  // Evitar hydration mismatch com tema
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificar se veio de um reset de senha
  useEffect(() => {
    const resetStatus = searchParams.get("reset");
    if (resetStatus === "success") {
      setSuccessMessage(
        "Você deverá receber em breve um e-mail com mais instruções."
      );
      // Limpar a URL
      window.history.replaceState({}, "", "/signin");
    }
  }, [searchParams]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Watch form values to enable/disable button
  const email = watch("email");
  const password = watch("password");

  // Validar se email tem @ e senha não está vazia
  const isFormValid = email?.includes("@") && password?.length > 0;

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setSuccessMessage(null);

    const result = await login(data.email, data.password);

    if (result.success) {
      // Aguardar um pouco para garantir que o AuthContext atualizou
      await new Promise(resolve => setTimeout(resolve, 100));
      // Redirecionar para a página inicial
      router.push('/inicio');
    } else {
      setError(result.error || "Erro ao fazer login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-xs">
        {/* Success message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 text-sm text-success-700 dark:text-success-400 bg-success-100 dark:bg-success-950/30 rounded-lg border border-success-300 dark:border-success-800"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Header with logo */}
        <div className="text-center mb-6">
          {mounted ? (
            <motion.div
              initial={{ scaleY: 1 }}
              animate={{
                scaleY: [1, 0.96, 1],
              }}
              transition={{
                duration: 0.45,
                times: [0, 0.5, 1],
                ease: "linear",
                delay: 0.15,
              }}
              className="flex justify-center mb-2"
            >
              <Image
                src={theme === 'dark' ? '/images/logo/auth-logo-dark.svg' : '/images/logo/auth-logo.svg'}
                alt="HB Track"
                width={180}
                height={60}
                priority
              />
            </motion.div>
          ) : (
            <div className="flex justify-center mb-2">
              <div style={{ width: 180, height: 60 }} />
            </div>
          )}
          <p
            className="text-sm text-gray-600 dark:text-gray-400"
            style={{ fontFamily: '"Inter", sans-serif', fontWeight: 300 }}
          >
            Dados que decidem jogos
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 text-xs text-error-700 dark:text-error-400 bg-error-100 dark:bg-error-950/30 rounded-lg border border-error-300 dark:border-error-800"
            >
              {error}
            </motion.div>
          )}

          {/* Email field */}
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
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-error-600 dark:text-error-400"
              >
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isLoading}
                  className={`
                      w-full px-3 py-2 pr-10 rounded-lg border text-sm
                      bg-white dark:bg-[#2a3441] 
                      text-gray-900 dark:text-white
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      focus:outline-hidden focus:ring-2 focus:ring-blue-500/30
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        errors.password
                          ? "border-error-500"
                          : "border-gray-300 dark:border-gray-700 focus:border-blue-500"
                      }
                    `}
                    placeholder="Senha"
                  />
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-error-600 dark:text-error-400"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isLoading || !isFormValid}
            whileHover={isFormValid && !isLoading ? { scale: 1.01 } : {}}
            whileTap={isFormValid && !isLoading ? { scale: 0.99 } : {}}
            className={`
              w-full py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                isFormValid && !isLoading
                  ? "bg-gray-400 hover:bg-gray-500 dark:bg-[#4a5568] dark:hover:bg-[#5a6578] text-white"
                  : "bg-gray-300 dark:bg-[#3a4452] text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Conectando...
              </span>
            ) : (
              "Conectar"
            )}
          </motion.button>

          {/* Esqueceu a senha link */}
          <div className="text-center pt-1">
            <Link
              href="/reset-password"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


