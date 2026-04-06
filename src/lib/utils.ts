export function formatCurrency(value: number): string {
  return "₺" + new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const STEP_LABELS: Record<string, string> = {
  s0: "Giriş",
  sPreg: "Gebelik",
  sPregRedirect: "Gebelik Yönlendirme",
  s1: "Aile Tipi",
  s2: "Yaş",
  s3: "Yaşam Tarzı",
  s4: "Mevcut Sigorta",
  s5: "Risk Profili",
  s6: "Kronik/Doğum",
  sLoad: "Yükleniyor",
  sResult: "Sonuç",
  sSuccess: "Başarılı",
};

export const FUNNEL_STEPS = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "sLoad", "sResult", "sSuccess"];

// Her yerde tutarlı kullanılması gereken marka cümlesi.
export const BRAND_TAGLINE = "30+'dan fazla sigorta firmasından teklif veriyoruz";

export const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  converted: "Dönüştürüldü",
  lost: "Kayıp",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};
