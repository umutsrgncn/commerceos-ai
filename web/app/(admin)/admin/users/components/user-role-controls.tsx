"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  deleteUserAction,
  updateUserRoleAction,
} from "@/lib/actions/users";

type Role = "ADMIN" | "MANAGER" | "VIEWER";

export function UserRoleControls({
  userId,
  currentRole,
  isMe,
}: {
  userId: string;
  currentRole: Role;
  isMe: boolean;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = role !== currentRole;

  function save() {
    setError(null);
    start(async () => {
      const r = await updateUserRoleAction(userId, role);
      if (!r.ok) {
        setError(r.error ?? "Hata");
        setRole(currentRole);
      } else {
        setSavedAt(Date.now());
      }
    });
  }

  function remove() {
    if (!confirm("Bu kullanıcıyı silmek istediğine emin misin?")) return;
    setError(null);
    start(async () => {
      const r = await deleteUserAction(userId);
      if (!r.ok) setError(r.error ?? "Hata");
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="h-8 text-xs"
        disabled={pending}
      >
        <option value="VIEWER">İzleyici</option>
        <option value="MANAGER">Operasyon</option>
        <option value="ADMIN">Yönetici</option>
      </Select>
      {dirty && (
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Kaydet
        </Button>
      )}
      {savedAt && !dirty && (
        <span className="text-[10px] text-emerald-600">✓</span>
      )}
      {!isMe && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={remove}
          disabled={pending}
          aria-label="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
      {error && (
        <span className="text-[10px] text-red-500" title={error}>
          !
        </span>
      )}
    </div>
  );
}
