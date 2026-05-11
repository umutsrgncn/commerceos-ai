"use client";

import { useActionState, useState } from "react";
import { Plus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { inviteUserAction, type UserActionState } from "@/lib/actions/users";

const initial: UserActionState = null;

export function InviteUserCard() {
  const [state, action, pending] = useActionState(inviteUserAction, initial);
  const [open, setOpen] = useState(false);

  if (state?.ok && open) {
    setOpen(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Yeni kullanıcı davet et
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-fuchsia-500" />
          Kullanıcı ekle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Geçici parola</Label>
            <Input
              id="password"
              name="password"
              type="text"
              minLength={8}
              required
              placeholder="En az 8 karakter"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Rol</Label>
            <Select id="role" name="role" defaultValue="VIEWER" required>
              <option value="VIEWER">İzleyici (yalnız okuma)</option>
              <option value="MANAGER">Operasyon</option>
              <option value="ADMIN">Yönetici</option>
            </Select>
          </div>

          {state?.error && (
            <p className="text-xs text-red-500 sm:col-span-2">{state.error}</p>
          )}

          <div className="flex items-center gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Ekleniyor..." : "Davet et"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
