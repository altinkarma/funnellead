import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

import path from "path";
const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const FIRMS = [
  { name: "Doğa Sigorta", package: "Y+A 6 Adet", premiums: { "0-1": 11135, "11-18": 5790, "25": 7126, "35": 8908, "45": 12471, "55": 17371, "65": 24942 } },
  { name: "Zurich Sigorta", package: "Y+A 5 Adet", premiums: { "0-1": 12504, "11-18": 6502, "25": 8002, "35": 10003, "45": 14004, "55": 19506, "65": 28008 } },
  { name: "Demir Sigorta", package: "Farkı Bizden", premiums: { "0-1": 13326, "11-18": 6930, "25": 8529, "35": 10661, "45": 14925, "55": 20789, "65": 29851 } },
  { name: "Ana Sigorta", package: "Y+A 10 Adet", premiums: { "0-1": 13744, "11-18": 7147, "25": 8796, "35": 10995, "45": 15393, "55": 21440, "65": 30786 } },
  { name: "Ankara Sigorta", package: "Y+A 10 Adet", premiums: { "0-1": 14845, "11-18": 7719, "25": 9501, "35": 11876, "45": 16626, "55": 23158, "65": 33253 } },
  { name: "MetLife", package: "Y+A 5 Adet", premiums: { "0-1": 15643, "11-18": 8134, "25": 10011, "35": 12514, "45": 17520, "55": 24402, "65": 35039 } },
  { name: "AK Sigorta", package: "Y+A Standart", premiums: { "0-1": 16415, "11-18": 8536, "25": 10506, "35": 13132, "45": 18385, "55": 25607, "65": 36770 } },
  { name: "Ray Sigorta", package: "Y+A Standart", premiums: { "0-1": 17173, "11-18": 8930, "25": 10990, "35": 13738, "45": 19233, "55": 26789, "65": 38466 } },
  { name: "Türkiye Sigorta", package: "Y+A Standart", premiums: { "0-1": 18130, "11-18": 9428, "25": 11603, "35": 14504, "45": 20306, "55": 28283, "65": 40611 } },
  { name: "Sompo Sigorta", package: "Y+A Standart", premiums: { "0-1": 18256, "11-18": 9493, "25": 11684, "35": 14605, "45": 20447, "55": 28480, "65": 40894 } },
  { name: "Anadolu Sigorta", package: "Y+A Standart", premiums: { "0-1": 19219, "11-18": 9994, "25": 12300, "35": 15375, "45": 21525, "55": 29981, "65": 43050 } },
  { name: "HDI Sigorta", package: "Y+A Standart", premiums: { "0-1": 19308, "11-18": 10040, "25": 12357, "35": 15446, "45": 21624, "55": 30120, "65": 43249 } },
  { name: "Quick Sigorta", package: "Y+A Standart", premiums: { "0-1": 28449, "11-18": 14793, "25": 18207, "35": 22759, "45": 31863, "55": 44380, "65": 63725 } },
];

const AGE_GROUPS = ["18-30", "31-45", "46-60", "60+"];
const FAMILY_TYPES = ["tek", "cift", "aile3", "aile4"];
const INSURANCES = ["yok", "sgk", "ozel", "ise"];
const CHRONIC = ["yok-kronik", "diyabet", "kalp", "diger"];
const STATUSES = ["new", "contacted", "converted", "lost"];
const LIFESTYLES = ["sedanter", "stres", "sigara", "spor", "kilo", "saglikli"];
const RISKS = ["ameliyat", "kanser", "kaza", "kronik", "cocuk", "sgk"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min = 1, max = 3): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomPhone(): string {
  return "+905" + Math.floor(Math.random() * 100000000 + 300000000).toString();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  // Clear existing data
  await prisma.funnelOption.deleteMany();
  await prisma.funnelScreen.deleteMany();
  await prisma.funnelEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.firm.deleteMany();
  await prisma.settings.deleteMany();

  // Seed firms
  for (const f of FIRMS) {
    await prisma.firm.create({
      data: {
        name: f.name,
        package: f.package,
        premiums: JSON.stringify(f.premiums),
        isActive: true,
      },
    });
  }

  // Seed settings
  await prisma.settings.create({
    data: { id: "global", familyDiscount: 0.10, newBizDiscount: 0.05 },
  });

  // ═══════ FUNNEL SCREENS & OPTIONS ═══════
  const screens = [
    {
      id: "s0", sortOrder: 0, selectMode: "none",
      title: "TSS ile yılda ne kadar tasarruf edersiniz?",
      subtitle: "6 hızlı soru yanıtlayın. Kişiselleştirilmiş tasarruf analizinizi ve size uygun 10+ sigorta firması teklifini görün.",
      buttonText: "Hesaplamaya Başla →",
      extraContent: JSON.stringify({
        stats: [
          { value: "₺18K+", label: "Ort. tasarruf" },
          { value: "10+", label: "Sigorta firması" },
          { value: "4.9★", label: "Kullanıcı puanı" },
        ],
        trustItems: ["Kredi kartı gerekmez", "Veriler güvende", "Bağlayıcı değil"],
      }),
    },
    {
      id: "sPreg", sortOrder: 1, stepLabel: "Ön Soru", selectMode: "single",
      title: "Doğum teminatı ihtiyacınız var mı?",
      subtitle: "Doğum teminatı olan TSS planları sınırlıdır. Aktif gebelikte sadece 2 firma teklif verebilir, planlanan gebeliklerde ise 5+ ay bekleme süresi uygulanır.",
      hint: "⚠️ Bu soru sizin veya eşinizin durumu için geçerlidir. Doğru yönlendirme için önemlidir.",
      options: [
        { icon: "🤱", label: "Aktif gebelik var", description: "Şu an hamileyim veya eşim hamile", value: "aktif", sortOrder: 0 },
        { icon: "📅", label: "Gebelik planlıyoruz", description: "Yakın zamanda bebek düşünüyoruz", value: "planlanan", sortOrder: 1 },
        { icon: "➡️", label: "Doğum teminatına ihtiyacım yok", description: "Normal TSS hesaplayıcıya devam et", value: "yok", sortOrder: 2 },
      ],
    },
    {
      id: "sPregRedirect", sortOrder: 2, selectMode: "none",
      title: "Aktif Gebelik — Özel Doğum Teminatı",
      subtitle: "Aktif gebelikte doğum teminatı verebilen Türkiye'de sadece 2 sigorta firması bulunuyor.",
      extraContent: JSON.stringify({
        costs: { normalBirth: "₺85K–₺110K", cesarean: "₺120K–₺180K" },
        coverageNote: "TSS doğum teminatı ile bu masraflar %80–100 karşılanır",
        firms: ["BupaAcıbadem Sigorta", "Demir Sağlık Sigorta"],
      }),
    },
    {
      id: "s1", sortOrder: 3, stepLabel: "Soru 1 / 7", selectMode: "single",
      title: "Kaç kişi için teklif almak istiyorsunuz?",
      subtitle: "Aile planları, bireysel planların toplamından ortalama %40 daha uygun fiyatlıdır.",
      hint: "💡 3 kişilik aile planı, bireysel üç plandan yılda ortalama ₺8.400 daha ucuz.",
      options: [
        { icon: "👤", label: "Sadece ben", description: "Bireysel plan", value: "tek", sortOrder: 0 },
        { icon: "👫", label: "Ben + eşim", description: "Çift planı", value: "cift", sortOrder: 1 },
        { icon: "👨‍👩‍👧", label: "Aile (3 kişi)", description: "Küçük aile planı", value: "aile3", sortOrder: 2 },
        { icon: "👨‍👩‍👧‍👦", label: "4+ kişilik aile", description: "Geniş aile planı", value: "aile4", sortOrder: 3 },
        { icon: "🤰", label: "Sadece Doğum Teminatı", description: "Hamilelik / doğum planı için özel teklif", value: "dogum", sortOrder: 4, style: JSON.stringify({ borderColor: "#E879F9", background: "#FDF4FF" }) },
      ],
    },
    {
      id: "s2", sortOrder: 4, stepLabel: "Soru 2 / 7", selectMode: "single",
      title: "Yaşınız kaç?",
      subtitle: "TSS primleri yaşa göre değişir. Doğru grubu seçmek, size en düşük fiyatı bulmamıza yardımcı olur.",
      hint: "💡 31-45 yaş grubu, TSS ile ortalama %34 daha fazla tasarruf ediyor.",
      options: [
        { icon: "🌱", label: "18 – 30 yaş", description: "Genç ve sağlıklı dönem", value: "18-30", sortOrder: 0 },
        { icon: "🏃", label: "31 – 45 yaş", description: "Aktif kariyer dönemi", value: "31-45", sortOrder: 1 },
        { icon: "👔", label: "46 – 60 yaş", description: "Kapsamlı teminat önemli", value: "46-60", sortOrder: 2 },
        { icon: "🌟", label: "60 yaş ve üzeri", description: "Geniş teminat dönemi", value: "60+", sortOrder: 3 },
      ],
    },
    {
      id: "s3", sortOrder: 5, stepLabel: "Soru 3 / 7", selectMode: "multi",
      title: "Yaşam tarzınız sağlık riskinizi nasıl etkiliyor?",
      subtitle: "Size en uygun teminatı belirlemek için birden fazla seçebilirsiniz.",
      buttonText: "Devam Et →",
      hint: "💡 Seçimleriniz yalnızca size uygun teminatı belirlemek için kullanılır, paylaşılmaz.",
      options: [
        { icon: "🪑", label: "Masa başı / hareketsiz çalışıyorum", description: "Sırt, boyun, göz yorgunluğu riski", value: "sedanter", sortOrder: 0 },
        { icon: "😓", label: "Yoğun stres & uyku sorunları", description: "Kardiyovasküler ve psikolojik risk", value: "stres", sortOrder: 1 },
        { icon: "🚬", label: "Sigara / tütün kullanıyorum", description: "Solunum yolu ve kalp riski artar", value: "sigara", sortOrder: 2 },
        { icon: "🏋️", label: "Düzenli spor yapıyorum", description: "Spor sakatlığı & fizik tedavi riski", value: "spor", sortOrder: 3 },
        { icon: "⚖️", label: "Kilo & beslenme sorunum var", description: "Metabolik hastalık riski", value: "kilo", sortOrder: 4 },
        { icon: "🥗", label: "Sağlıklı & aktif bir yaşam sürüyorum", description: "Düşük risk profili", value: "saglikli", sortOrder: 5 },
      ],
    },
    {
      id: "s4", sortOrder: 6, stepLabel: "Soru 4 / 7", selectMode: "single",
      title: "Şu an sağlık sigortanız var mı?",
      subtitle: "Mevcut durumunuzu öğrenerek en hızlı geçiş ve en uygun teklifi buluyoruz.",
      options: [
        { icon: "❌", label: "Sigortam yok", description: "En yüksek tasarruf potansiyeli", value: "yok", sortOrder: 0 },
        { icon: "🏛", label: "Sadece SGK / devlet", description: "Özel tedaviler cebinizden çıkıyor", value: "sgk", sortOrder: 1 },
        { icon: "🔵", label: "Özel sağlık sigortam var", description: "TSS ile daha kapsamlı tamamlama", value: "ozel", sortOrder: 2 },
        { icon: "🏢", label: "İşveren sigortam var", description: "İş değişiminde boşluk oluşabilir", value: "ise", sortOrder: 3 },
      ],
    },
    {
      id: "s5", sortOrder: 7, stepLabel: "Soru 5 / 7", selectMode: "multi",
      title: "Sizi en çok zorlayan sağlık riski hangisi?",
      subtitle: "Özel hastane faturalarını beklenmedik biçimde artıran durumları seçin. TSS tam da bu anlarda devreye girer. Birden fazla seçebilirsiniz.",
      buttonText: "Teklifimi Hazırla →",
      hint: "🔒 Seçimleriniz yalnızca size uygun teminat önerisinde kullanılır.",
      options: [
        { icon: "🔪", label: "Beklenmedik ameliyat", description: "Özel hastanede ortalama ₺40K–₺120K arası fatura oluşur", value: "ameliyat", sortOrder: 0 },
        { icon: "🎗️", label: "Kanser / ağır hastalık teşhisi", description: "Kemoterapi + hastane masrafları ₺200K+'yı aşabilir", value: "kanser", sortOrder: 1 },
        { icon: "🚗", label: "Trafik kazası / iş kazası", description: "Acil + yoğun bakım + rehabilitasyon zinciri, SGK karşılamaz", value: "kaza", sortOrder: 2 },
        { icon: "💉", label: "Kronik hastalık yönetimi", description: "Aylık ilaç + kontrol masrafı yılda ₺15K–₺40K ulaşabilir", value: "kronik", sortOrder: 3 },
        { icon: "👶", label: "Çocuğun ani hastalanması", description: "Gece acil + uzman muayene + tahlil = beklenmedik masraf", value: "cocuk", sortOrder: 4 },
        { icon: "🏛️", label: "SGK'nın karşılamadığı durumlar", description: "Özel doktor farkı, konfor odası, bazı malzeme ve ilaçlar", value: "sgk", sortOrder: 5 },
      ],
    },
    {
      id: "s6", sortOrder: 8, stepLabel: "Soru 6 / 7", selectMode: "single",
      title: "Kronik bir rahatsızlığınız var mı?",
      subtitle: "Bu bilgi, hangi teminata öncelik vermeniz gerektiğini belirler ve en avantajlı planı bulmamızı sağlar.",
      hint: "🔒 Sağlık bilgileriniz yalnızca size uygun plan önerisinde kullanılır ve kesinlikle paylaşılmaz.",
      options: [
        { icon: "✅", label: "Hayır, kronik hastalığım yok", description: "Standart plan yeterli", value: "yok-kronik", sortOrder: 0 },
        { icon: "🩺", label: "Diyabet / tansiyon", description: "Kronik ilaç + takip teminatı önemli", value: "diyabet", sortOrder: 1 },
        { icon: "❤️", label: "Kalp & damar hastalıkları", description: "Kardiyoloji teminatı ön planda", value: "kalp", sortOrder: 2 },
        { icon: "📋", label: "Diğer kronik hastalık", description: "Uzman danışmanlığı gerekebilir", value: "diger", sortOrder: 3 },
        { icon: "🤰", label: "Planlanan gebelik / doğum beklentisi var", description: "Normal doğum ₺25K–₺60K, sezaryen ₺35K–₺90K — TSS doğum teminatı ile karşılanabilir", value: "dogum", sortOrder: 4, style: JSON.stringify({ borderColor: "#E879F9", background: "#FDF4FF" }), condition: JSON.stringify({ familyType: ["cift", "aile3", "aile4", "dogum"] }) },
      ],
    },
    {
      id: "sLoad", sortOrder: 9, selectMode: "none",
      title: "Analiziniz hazırlanıyor…",
      subtitle: "Yanıtlarınız değerlendiriliyor",
      extraContent: JSON.stringify({
        steps: [
          "Yaş & aile profili analiz ediliyor",
          "Harcama verileri hesaplanıyor",
          "10+ sigorta firması karşılaştırılıyor",
          "Size özel tasarruf raporu oluşturuluyor",
        ],
      }),
    },
    {
      id: "sPhone", sortOrder: 10, selectMode: "none",
      title: "Teklifleri görmek için numara doğrulama",
      subtitle: "10+ sigorta firmasının fiyat tekliflerini ve kişisel tasarruf raporunuzu WhatsApp ile göndermek için telefon numaranızı doğrulayın.",
      buttonText: "Doğrulama Kodu Gönder 📲",
      extraContent: JSON.stringify({
        trustItems: ["🔒 Numara paylaşılmaz", "📵 Rıza dışı aranmazsınız"],
        otpTitle: "Doğrulama kodunu girin",
        otpDesc: "SMS veya WhatsApp ile gönderilen 4 haneli kodu girin.",
        otpButton: "Kodu Onayla & Raporu Gör ✅",
        countryCodes: [
          { code: "+90", flag: "🇹🇷" },
          { code: "+49", flag: "🇩🇪" },
          { code: "+44", flag: "🇬🇧" },
          { code: "+1", flag: "🇺🇸" },
        ],
      }),
    },
    {
      id: "sResult", sortOrder: 11, selectMode: "none",
      title: "Tahmini yıllık tasarrufunuz",
      subtitle: "Tamamlayıcı Sağlık Sigortası ile",
      extraContent: JSON.stringify({
        badge: "📊 KİŞİSEL TASARRUF RAPORU",
        comparison: [
          { icon: "🔪", label: "Ameliyat Masrafı", before: "₺50.000+ cebinizden", after: "Ücretsiz (TSS karşılar)" },
          { icon: "🩺", label: "Muayene Ücreti", before: "₺1.500–₺2.500/seans", after: "₺60 katılım payı" },
          { icon: "🔬", label: "Tahlil / MR / Tetkik", before: "₺3.000–₺8.000", after: "Ücretsiz" },
          { icon: "💊", label: "Yıllık Check-up", before: "₺4.000–₺8.000", after: "Ücretsiz hediye" },
          { icon: "🏥", label: "Özel Hastane Erişimi", before: "SGK fark ücreti cebinizden", after: "850+ özel hastane anlaşmalı" },
        ],
        ctaStrip: "Sen de bu dönüşümü yaşa",
        planFeatures: [
          "Ameliyat masrafları tamamen karşılanır",
          "Yıllık 8–12 arası ayakta muayene hakkı",
          "Tahlil, MR ve tetkikler ücretsiz",
          "Diş temizleme hediye olarak verilir",
          "Yıllık check-up ücretsiz hediye",
          "850+ anlaşmalı özel hastane",
        ],
        urgencyText: "Bu analiz 24 saat geçerlidir. Bugün başvuranlar 3 ay ücretsiz ek teminat kazanır.",
        waSection: {
          title: "📲 13 Firmadan WhatsApp'a Teklif Al",
          desc: "Kişisel tasarruf raporunuzu ve 13 sigorta firmasının fiyat tekliflerini WhatsApp üzerinden 2 saat içinde alın. Tamamen ücretsiz, bağlayıcı değil.",
          benefits: [
            "Doğa, Zurich, Demir, Ana, Ankara ve 8+ firma fiyatı",
            "Kişisel tasarruf raporu PDF olarak iletilir",
            "Uzman danışman size özel plan önerir",
            "Ücretsiz, bağlayıcı değil, iptal garantili",
          ],
          buttonText: "WhatsApp'ta Teklif Al – Ücretsiz",
        },
        faq: [
          { q: "TSS (Tamamlayıcı Sağlık Sigortası) nedir?", a: "TSS, SGK güvencenize ek olarak özel hastanelerdeki tedavi giderlerinizi karşılayan bir sigorta türüdür." },
          { q: "TSS'ye başvurmak için SGK'lı olmam şart mı?", a: "Evet, TSS SGK güvencenizi tamamlar — bu nedenle aktif bir SGK kaydı gerekir." },
          { q: "Hangi giderler TSS kapsamında karşılanır?", a: "Muayene farkları, ameliyat masrafları, ilaç giderleri, yatarak tedavi oda farkları, diş, göz ve psikoloji." },
          { q: "TSS ile hangi hastanelerde tedavi görebilirim?", a: "500 ile 1.000+ anlaşmalı özel hastanede tedavi görebilirsiniz." },
          { q: "Mevcut hastalığım varsa TSS'ye başvurabilir miyim?", a: "Başvurabilirsiniz, ancak bekleme süresi veya sınırlama uygulanabilir." },
          { q: "TSS primi ne kadar?", a: "Yaş, aile büyüklüğü ve teminat paketine göre belirlenir. 18-30 yaş bireysel: ₺800–₺1.400/ay." },
        ],
        reviews: [
          { name: "Ahmet K.", age: 42, city: "İstanbul", detail: "3 kişilik aile", rating: 5, savings: "₺38.800" },
          { name: "Selin Y.", age: 34, city: "Ankara", detail: "Bireysel", rating: 5, savings: "₺11.520" },
          { name: "Mehmet C.", age: 57, city: "İzmir", detail: "Eş ile", rating: 5, savings: "₺15.400" },
          { name: "Fatma D.", age: 28, city: "Bursa", detail: "Çift plan", rating: 5, savings: "₺11.900" },
          { name: "Tarık Ö.", age: 46, city: "Antalya", detail: "4 kişilik aile", rating: 5, savings: "₺24.800" },
        ],
      }),
    },
    {
      id: "sSuccess", sortOrder: 12, selectMode: "none",
      title: "Başvurunuz Alındı!",
      subtitle: "WhatsApp danışmanımız 2 saat içinde size ulaşacak. Kişisel tasarruf raporunuz ve 10+ firma teklifi hazırlanıyor.",
      extraContent: JSON.stringify({
        badge: "TİMURLAR SİGORTA PLUS",
        nextSteps: [
          "📱 WhatsApp danışman araması (1-2 saat)",
          "📧 Kişisel rapor PDF olarak iletilir",
          "📋 12 firma fiyat karşılaştırması",
          "✅ Tamamen ücretsiz ve bağlayıcı değil",
        ],
      }),
    },
  ];

  for (const s of screens) {
    const { options, ...screenData } = s as any;
    await prisma.funnelScreen.create({
      data: {
        ...screenData,
        stepLabel: screenData.stepLabel || null,
        subtitle: screenData.subtitle || null,
        hint: screenData.hint || null,
        buttonText: screenData.buttonText || null,
        extraContent: screenData.extraContent || null,
      },
    });
    if (options) {
      for (const opt of options) {
        await prisma.funnelOption.create({
          data: {
            screenId: screenData.id,
            icon: opt.icon || null,
            label: opt.label,
            description: opt.description || null,
            value: opt.value,
            sortOrder: opt.sortOrder || 0,
            style: opt.style || null,
            condition: opt.condition || null,
          },
        });
      }
    }
  }

  // Seed 80 leads over last 30 days
  const STEPS = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "sPhone", "sResult", "sSuccess"];

  for (let i = 0; i < 80; i++) {
    const day = Math.floor(Math.random() * 30);
    const created = daysAgo(day);
    const sid = `TSS-SEED-${Date.now()}-${i}`;
    const age = randomFrom(AGE_GROUPS);
    const fam = randomFrom(FAMILY_TYPES);
    const ins = randomFrom(INSURANCES);
    const chr = randomFrom(CHRONIC);
    const life = randomSubset(LIFESTYLES, 1, 3);
    const risk = randomSubset(RISKS, 1, 3);
    const savings = Math.round((Math.random() * 40000 + 8000) / 100) * 100;

    // How far they got in the funnel (weighted toward later steps)
    const maxStep = Math.min(
      STEPS.length - 1,
      Math.floor(Math.random() * STEPS.length * 1.3)
    );
    const completedSteps = STEPS.slice(0, maxStep + 1);

    const hasPhone = maxStep >= 7; // reached sPhone
    const status = maxStep >= 9
      ? randomFrom(["converted", "contacted"])
      : maxStep >= 7
        ? randomFrom(["new", "contacted", "new"])
        : randomFrom(["new", "lost"]);

    await prisma.lead.create({
      data: {
        sessionId: sid,
        phone: hasPhone ? randomPhone() : null,
        createdAt: created,
        ageGroup: age,
        familyType: fam,
        lifestyle: JSON.stringify(life),
        insurance: ins,
        risks: JSON.stringify(risk),
        chronicCondition: chr,
        estimatedSavings: savings,
        status,
      },
    });

    // Create funnel events for this lead
    for (const step of completedSteps) {
      await prisma.funnelEvent.create({
        data: {
          sessionId: sid,
          step,
          action: step === "s1" ? `select:${fam}` : step === "s2" ? `select:${age}` : null,
          createdAt: new Date(created.getTime() + STEPS.indexOf(step) * 15000),
        },
      });
    }
  }

  console.log("Seed completed: 13 firms, 80 leads, funnel events created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
