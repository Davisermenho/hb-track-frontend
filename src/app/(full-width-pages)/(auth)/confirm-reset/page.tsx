import ResetPasswordConfirm from "@/components/auth/ResetPasswordConfirm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Redefinir Senha | HB Tracking - Sistema de Gestão de Handebol",
  description:
    "Crie uma nova senha para sua conta HB Tracking",
};

export default function ConfirmResetPassword() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <ResetPasswordConfirm />
    </Suspense>
  );
}
