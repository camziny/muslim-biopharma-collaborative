"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminMemberSchema,
  memberSchema,
  type AdminMemberFormValues,
  type MemberFormValues,
} from "@/lib/member-schema";
import {
  adminUpdateMember,
  registerMember,
  updateMyProfile,
} from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MemberFormProps = {
  mode: "register" | "edit";
  defaultValues?: MemberFormValues;
  workEmail?: string;
};

type AdminMemberFormProps = {
  rowIndex: number;
  defaultValues: AdminMemberFormValues;
  onSuccess?: () => void;
};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function MemberForm({ mode, defaultValues, workEmail }: MemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaultValues ?? {
      name: "",
      company: "",
      title: "",
      function: "",
      diseaseAreas: "",
      emailPersonal: "",
      phone: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "register"
          ? await registerMember(values)
          : await updateMyProfile(values);

      if (result?.success === false) {
        toast.error(result.message ?? "Something went wrong.");
        return;
      }

      if (mode === "edit") {
        toast.success(result.message ?? "Profile updated.");
        router.refresh();
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {workEmail ? (
        <Field id="workEmail" label="Work email">
          <Input id="workEmail" value={workEmail} disabled readOnly />
        </Field>
      ) : null}

      <Field id="name" label="Name" error={errors.name?.message}>
        <Input id="name" {...register("name")} autoComplete="name" />
      </Field>

      <Field id="company" label="Company" error={errors.company?.message}>
        <Input
          id="company"
          {...register("company")}
          autoComplete="organization"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="title" label="Title" error={errors.title?.message}>
          <Input id="title" {...register("title")} />
        </Field>

        <Field id="function" label="Function" error={errors.function?.message}>
          <Input id="function" {...register("function")} />
        </Field>
      </div>

      <Field
        id="diseaseAreas"
        label="Disease areas / platform of focus"
        error={errors.diseaseAreas?.message}
      >
        <Textarea id="diseaseAreas" {...register("diseaseAreas")} rows={3} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="emailPersonal"
          label="Personal email (optional)"
          error={errors.emailPersonal?.message}
        >
          <Input
            id="emailPersonal"
            {...register("emailPersonal")}
            type="email"
            autoComplete="email"
          />
        </Field>

        <Field id="phone" label="Phone (optional)" error={errors.phone?.message}>
          <Input id="phone" {...register("phone")} type="tel" autoComplete="tel" />
        </Field>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending
          ? "Saving..."
          : mode === "register"
            ? "Complete registration"
            : "Save changes"}
      </Button>
    </form>
  );
}

export function AdminMemberForm({
  rowIndex,
  defaultValues,
  onSuccess,
}: AdminMemberFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminMemberFormValues>({
    resolver: zodResolver(adminMemberSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await adminUpdateMember(rowIndex, values);
      if (!result.success) {
        toast.error(result.message ?? "Unable to update member.");
        return;
      }
      toast.success(result.message ?? "Member updated.");
      onSuccess?.();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field id="emailWork" label="Work email" error={errors.emailWork?.message}>
        <Input id="emailWork" {...register("emailWork")} type="email" />
      </Field>

      <Field id="admin-name" label="Name" error={errors.name?.message}>
        <Input id="admin-name" {...register("name")} />
      </Field>

      <Field id="admin-company" label="Company" error={errors.company?.message}>
        <Input id="admin-company" {...register("company")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="admin-title" label="Title" error={errors.title?.message}>
          <Input id="admin-title" {...register("title")} />
        </Field>
        <Field
          id="admin-function"
          label="Function"
          error={errors.function?.message}
        >
          <Input id="admin-function" {...register("function")} />
        </Field>
      </div>

      <Field
        id="admin-diseaseAreas"
        label="Disease areas / platform of focus"
        error={errors.diseaseAreas?.message}
      >
        <Textarea
          id="admin-diseaseAreas"
          {...register("diseaseAreas")}
          rows={3}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="admin-emailPersonal"
          label="Personal email"
          error={errors.emailPersonal?.message}
        >
          <Input
            id="admin-emailPersonal"
            {...register("emailPersonal")}
            type="email"
          />
        </Field>
        <Field id="admin-phone" label="Phone" error={errors.phone?.message}>
          <Input id="admin-phone" {...register("phone")} type="tel" />
        </Field>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save member"}
      </Button>
    </form>
  );
}
