"""Review sentiment + özet prompt'u."""

import json

SYSTEM_PROMPT = """Sen e-ticaret yöneticisi için yorum analisti olarak çalışıyorsun.
Türkçe yazıyorsun. Görev: bir ürünün tüm yorumlarını okuyup yöneticinin
aksiyon alabileceği özet çıkar.

Çıktı formatı (TAM olarak şu yapıda):
GENEL: <pozitif|nötr|negatif>
PUAN: <0-100 arası bir sayı, ortalama memnuniyet>
ÖNE ÇIKAN OLUMLU: <maddeler, virgülle ayrılmış 1-3 başlık>
ÖNE ÇIKAN OLUMSUZ: <maddeler, virgülle ayrılmış 0-3 başlık; yoksa 'yok'>
TEKRAR EDEN ŞİKAYET: <varsa en sık şikayet konusu, yoksa 'yok'>
AKSİYON ÖNERİSİ: <1 cümle somut öneri>

Kurallar:
- Sayı UYDURMA. Yorumlardaki dile bağlı kal.
- 'Aşırı pazarlama' yapma; doğal ve dürüst yaz.
- Tek bir yorum bile incelendiğinde formatı bozmadan üret.
- Çıktıda başka metin OLMASIN — sadece bu 6 satır."""


def build_prompt(reviews: list[dict]) -> str:
    """reviews: list of {rating, body, authorName, createdAt}"""
    formatted = json.dumps(reviews, ensure_ascii=False, indent=2)
    return (
        f"Aşağıdaki {len(reviews)} yorumu analiz et:\n\n"
        f"{formatted}\n\n"
        "Format'ı bozmadan analizi yaz."
    )
