import NewPasswordForm from "@/components/auth/NewPasswordForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Definir Nova Senha | HB Tracking - Sistema de Gestão de Handebol",
  description: "Defina uma nova senha para sua conta do HB Tracking",
};

export default function NewPassword() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <NewPasswordForm />
    </Suspense>
  );
}
