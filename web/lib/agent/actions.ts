"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";

export type CreateState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | null;

function validateTitle(t: string) {
  const v = t.trim();
  if (v.length < 3) return "Başlık çok kısa";
  if (v.length > 120) return "Başlık çok uzun (max 120)";
  return null;
}

function validatePrompt(p: string) {
  const v = p.trim();
  if (v.length < 10) return "Açıklama çok kısa (en az 10 karakter)";
  if (v.length > 4000) return "Açıklama çok uzun (max 4000)";
  return null;
}

export async function createAgentTaskAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const title = (formData.get("title") as string | null) ?? "";
  const prompt = (formData.get("prompt") as string | null) ?? "";

  const titleErr = validateTitle(title);
  if (titleErr) return { ok: false, error: titleErr };
  const promptErr = validatePrompt(prompt);
  if (promptErr) return { ok: false, error: promptErr };

  const task = await db.agentTask.create({
    data: {
      title: title.trim(),
      prompt: prompt.trim(),
      status: "PENDING",
      // targetScopes: null — planner triage'da dolduracak
    },
    select: { id: true },
  });

  await emitAgentEvent({
    taskId: task.id,
    type: "NOTE",
    summary: "Task oluşturuldu, sıraya alındı.",
  });

  revalidatePath("/admin/agent");
  redirect(`/admin/agent/${task.id}`);
}

export async function iterateAgentTaskAction(id: string, feedback: string) {
  const v = feedback.trim();
  if (v.length < 5) return { ok: false, error: "Geri bildirim çok kısa (en az 5 karakter)" };
  if (v.length > 2000) return { ok: false, error: "Geri bildirim çok uzun (max 2000)" };

  const task = await db.agentTask.findUnique({ where: { id } });
  if (!task) return { ok: false, error: "Task bulunamadı" };
  if (task.status !== "REVIEW") {
    return { ok: false, error: `Geri besleme sadece REVIEW durumunda alınır (mevcut: ${task.status})` };
  }

  // Feedback'i event'e yaz — runner bunu okuyup prompt'a ekleyecek
  await emitAgentEvent({
    taskId: id,
    type: "NOTE",
    summary: `Kullanıcı geri bildirimi: ${v}`,
    payload: { kind: "user_feedback", feedback: v },
  });

  // Status'u PENDING'e çek — worker sahiplenecek, mevcut worktree korunur
  await db.agentTask.update({
    where: { id },
    data: {
      status: "PENDING",
      cancelRequested: false,
      completedAt: null,
      errorMsg: null,
    },
  });
  await emitAgentEvent({
    taskId: id,
    type: "STATUS",
    summary: "Yeni iterasyon başlıyor — agent geri bildirimi alıp düzenleme yapacak.",
  });

  revalidatePath(`/admin/agent/${id}`);
  return { ok: true };
}

export async function approveAgentTaskAction(id: string) {
  const task = await db.agentTask.findUnique({ where: { id } });
  if (!task) return { ok: false, error: "Task bulunamadı" };
  if (task.status !== "REVIEW") {
    return { ok: false, error: `Onay için status REVIEW olmalı (mevcut: ${task.status})` };
  }
  await db.agentTask.update({
    where: { id },
    data: { status: "MERGED", completedAt: new Date() },
  });
  await emitAgentEvent({
    taskId: id,
    type: "STATUS",
    summary: "Onaylandı — main'e merge işlemi başlatılacak.",
    payload: { from: "REVIEW", to: "MERGED" },
  });
  revalidatePath(`/admin/agent/${id}`);
  revalidatePath("/admin/agent");
  return { ok: true };
}

export async function rejectAgentTaskAction(id: string) {
  const task = await db.agentTask.findUnique({ where: { id } });
  if (!task) return { ok: false, error: "Task bulunamadı" };
  if (task.status === "MERGED") return { ok: false, error: "Merge edilmiş task reddedilemez" };
  await db.agentTask.update({
    where: { id },
    data: { status: "REJECTED", completedAt: new Date() },
  });
  await emitAgentEvent({
    taskId: id,
    type: "STATUS",
    summary: "Reddedildi — worktree ve branch temizlenecek.",
    payload: { from: task.status, to: "REJECTED" },
  });
  revalidatePath(`/admin/agent/${id}`);
  revalidatePath("/admin/agent");
  return { ok: true };
}

export async function cancelAgentTaskAction(id: string) {
  const task = await db.agentTask.findUnique({ where: { id } });
  if (!task) return { ok: false, error: "Task bulunamadı" };

  // PENDING ise direkt CANCELLED'a çek — worker hiç almadı zaten
  if (task.status === "PENDING") {
    await db.agentTask.update({
      where: { id },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
    await emitAgentEvent({
      taskId: id,
      type: "STATUS",
      summary: "Sıradan çıkarıldı (PENDING iken iptal).",
      payload: { from: "PENDING", to: "CANCELLED" },
    });
    revalidatePath(`/admin/agent/${id}`);
    revalidatePath("/admin/agent");
    return { ok: true };
  }

  // Çalışıyorsa flag set — worker iteration arasında okuyup duracak
  if (["PLANNING", "RUNNING", "TESTING"].includes(task.status)) {
    if (task.cancelRequested) return { ok: false, error: "İptal zaten istenmiş" };
    await db.agentTask.update({
      where: { id },
      data: { cancelRequested: true },
    });
    await emitAgentEvent({
      taskId: id,
      type: "STATUS",
      summary: "Durdurma istendi — agent mevcut adımı bitirip duracak.",
      payload: { cancelRequested: true },
    });
    revalidatePath(`/admin/agent/${id}`);
    return { ok: true };
  }

  return { ok: false, error: `Bu durumda iptal edilemez (${task.status})` };
}

export async function deleteAgentTaskAction(id: string) {
  const task = await db.agentTask.findUnique({ where: { id } });
  if (!task) return { ok: false, error: "Task bulunamadı" };
  if (["PLANNING", "RUNNING", "TESTING"].includes(task.status)) {
    return { ok: false, error: "Çalışan task silinemez, önce reddedin" };
  }
  await db.agentTask.delete({ where: { id } });
  revalidatePath("/admin/agent");
  return { ok: true };
}
