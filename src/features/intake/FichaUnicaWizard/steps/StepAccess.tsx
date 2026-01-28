'use client';

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import { Shield, Info, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { FormField } from "../components/FormField";
import { RoleSelect } from "../components/RoleSelect";
import { FichaUnicaPayload } from "../types";
import { usersService } from "@/lib/api/users";

export function StepAccess() {
  const { watch, setValue, setError, clearErrors } = useFormContext<FichaUnicaPayload>();
  const createUser = watch("create_user");
  const primaryEmail = watch("person.contacts")?.find((c) => c.contact_type === "email" && c.is_primary)?.contact_value;
  const firstEmail = watch("person.contacts")?.find((c) => c.contact_type === "email")?.contact_value;
  const email = watch("user.email");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "taken" | "ok">("idle");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!createUser || !email || !email.includes("@")) {
        if (!cancelled) {
          setEmailStatus("idle");
          setEmailMessage("");
          clearErrors("user.email");
        }
        return;
      }

      setEmailStatus("checking");
      setEmailMessage("");
      try {
        const result = await usersService.list({ search: email, limit: 1 });
        const exists = result.items?.some((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (cancelled) return;
        if (exists) {
          setError("user.email", { type: "manual", message: "Email já cadastrado no sistema" });
          setEmailStatus("taken");
          setEmailMessage("Email já existe. Use outro ou não crie usuário.");
        } else {
          clearErrors("user.email");
          setEmailStatus("ok");
          setEmailMessage("Email disponível");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao verificar email", err);
          setEmailStatus("idle");
        }
      }
    };

    const timer = setTimeout(run, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [createUser, email, clearErrors, setError]);

  const handleCreateUserToggle = (checked: boolean) => {
    setValue("create_user", checked);

    if (checked) {
      const emailToUse = primaryEmail || firstEmail || "";
      setValue("user.email", emailToUse);

      if (!watch("user.role_id")) {
        setValue("user.role_id", 4);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <Shield className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Acesso ao Sistema</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Crie um usuário para que esta pessoa possa acessar o sistema
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
        <input
          type="checkbox"
          checked={createUser}
          onChange={(e) => handleCreateUserToggle(e.target.checked)}
          className="mt-1 size-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
        />
        <div className="flex-1">
          <label className="text-base font-medium text-gray-900 dark:text-white cursor-pointer">Criar usuário de acesso</label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Marque esta opção se a pessoa precisar acessar o sistema</p>
        </div>
      </div>

      {createUser && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <FormField
              name="user.email"
              label="Email de Acesso"
              type="email"
              placeholder="usuario@email.com"
              required
              helpText="Este será o email usado para login no sistema"
            />

            <RoleSelect
              name="user.role_id"
              label="Papel no Sistema"
              required
              helpText="Define as permissões do usuário no sistema"
            />
          </div>

          {emailStatus !== "idle" && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                emailStatus === "taken"
                  ? "text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30"
                  : "text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/30"
              }`}
            >
              {emailStatus === "checking" && <Loader2 className="size-4 animate-spin" />}
              {emailStatus === "taken" && <AlertTriangle className="size-4" />}
              {emailStatus === "ok" && <CheckCircle2 className="size-4" />}
              <span>{emailStatus === "checking" ? "Verificando email..." : emailMessage}</span>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900">
            <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">Ativação Automática</h4>
              <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
                Um email será enviado automaticamente para <strong>{watch("user.email")}</strong> com instruções para ativar a conta e definir a senha.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sobre os Papéis:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="inline-block size-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-white">Dirigente:</strong> Pode criar e gerenciar organizações, temporadas, equipes e todos os usuários
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block size-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-white">Coordenador:</strong> Gerencia equipes, atletas e treinadores dentro da organização
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block size-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-white">Treinador:</strong> Gerencia atletas, treinos e jogos da equipe
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block size-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-white">Atleta:</strong> Visualiza seus próprios dados, treinos e jogos
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {!createUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <Info className="size-5 text-gray-500 dark:text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta pessoa será cadastrada apenas como registro no sistema, sem acesso de login. Você poderá criar um usuário para ela posteriormente, se necessário.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
