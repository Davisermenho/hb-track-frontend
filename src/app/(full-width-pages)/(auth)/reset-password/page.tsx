import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Senha | HB Tracking - Sistema de Gestão de Handebol",
  description:
    "Recupere seu acesso ao HB Tracking usando seu email registrado",
};

export default function ResetPassword() {
  return <ForgotPasswordForm />;
}
