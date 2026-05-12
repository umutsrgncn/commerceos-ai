import { Clock, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";

export const metadata = { title: "İletişim · Pamuk" };

export default function ContactPage() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            Buradayız
          </p>
          <h1 className="font-display text-4xl italic leading-tight sm:text-5xl">
            İletişim
          </h1>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
        Sorun, öneri veya iş birliği için tek bir mesaj yeterli. Hafta içi mesai
        saatlerinde 1 iş günü, dışında 2 iş günü içinde dönüş yapıyoruz.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Sol — bilgi blokları */}
        <div className="space-y-4">
          <InfoCard
            icon={<Mail className="h-5 w-5" />}
            title="E-posta"
            content="merhaba@pamuktekstil.com"
            link="mailto:merhaba@pamuktekstil.com"
          />
          <InfoCard
            icon={<Phone className="h-5 w-5" />}
            title="Telefon"
            content="0212 555 12 34"
            link="tel:+902125551234"
          />
          <InfoCard
            icon={<MapPin className="h-5 w-5" />}
            title="Atölye & showroom"
            content={
              <>
                Levent Mah. Atatürk Cad. No: 14
                <br />
                34330 Beşiktaş / İstanbul
              </>
            }
          />
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            title="Çalışma saatleri"
            content={
              <>
                Pazartesi — Cumartesi · 10:00 — 19:00
                <br />
                Pazar kapalı
              </>
            }
          />

          {/* Sosyal */}
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              Sosyal medya
            </h3>
            <div className="mt-4 flex gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.04]"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="grid h-10 w-10 place-items-center rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.04]"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Sağ — iletişim formu */}
        <form className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:p-7">
          <h2 className="font-display text-2xl italic">Bize yaz</h2>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            Mesajın doğrudan müşteri hizmetleri ekibine gider.
          </p>

          <div className="mt-6 space-y-4">
            <Field label="Ad Soyad" name="name" required />
            <Field label="E-posta" name="email" type="email" required />
            <Field
              label="Konu"
              name="subject"
              placeholder="Sipariş, iade, öneri vb."
            />
            <div>
              <label
                htmlFor="message"
                className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
              >
                Mesaj <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="Detayları paylaş…"
                className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)]"
          >
            Mesajı gönder
            <Mail className="h-4 w-4" />
          </button>

          <p className="mt-4 text-[10px] leading-relaxed text-[color:var(--color-muted)]">
            Formu göndererek{" "}
            <a
              href="/shop/kvkk"
              className="underline-offset-2 hover:text-[color:var(--color-accent)] hover:underline"
            >
              KVKK aydınlatma metnini
            </a>{" "}
            okuyup kabul ettiğini onaylamış olursun. Hackathon scope —
            şimdilik form sadece görsel.
          </p>
        </form>
      </div>
    </>
  );
}

function InfoCard({
  icon,
  title,
  content,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  link?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[color:var(--color-accent)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          {title}
        </p>
        <div className="mt-1 text-sm text-[color:var(--color-fg)]/90 leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
  return link ? <a href={link}>{inner}</a> : inner;
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
      />
    </div>
  );
}
