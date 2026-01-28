import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login | HB Tracking - Sistema de Gestão de Handebol",
  description: "Faça login no HB Tracking para acessar o sistema de gestão de handebol",
};

export default function SignIn() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <SignInForm />
    </Suspense>
  );
}
