"""Gemini tool declarations.

Two tools only:
  - query_database: model writes SQL; we run it as a read-only Postgres
    user, hard-cap rows + statement timeout.
  - render_chart: client-side chart render embedded in the assistant's
    final message.
"""

from google.genai import types

TOOLS: list[types.Tool] = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="query_database",
                description=(
                    "Postgres veritabanına SELECT sorgusu çalıştır. "
                    "Read-only kullanıcıyla bağlanır — INSERT/UPDATE/DELETE "
                    "veya başka yazma denemesi reddedilir. "
                    "Sayım, toplam, sıralama, JOIN, GROUP BY tüm SELECT "
                    "yetenekleri kullanılabilir. "
                    "Tablo ve kolon adları PascalCase ve ÇİFT TIRNAK içinde "
                    "yazılmalı (örn. \"Order\", \"createdAt\"). "
                    "Para alanları INT olarak kuruş — kullanıcıya gösterirken "
                    "100'e böl ve ₺ yaz."
                ),
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "sql": types.Schema(
                            type=types.Type.STRING,
                            description=(
                                "Tek bir SELECT (veya WITH … SELECT) cümlesi. "
                                "Sonunda noktalı virgül opsiyonel. LIMIT yoksa "
                                "otomatik eklenir."
                            ),
                        ),
                        "explanation": types.Schema(
                            type=types.Type.STRING,
                            description=(
                                "Bu sorgunun neyi cevapladığını 1 cümlede yaz. "
                                "Kullanıcıya gösterilir."
                            ),
                        ),
                    },
                    required=["sql"],
                ),
            ),
            types.FunctionDeclaration(
                name="render_chart",
                description=(
                    "Cevabın içine bir grafik blok eklemek istediğinde çağır. "
                    "Chart frontend'te otomatik render edilir. SADECE veri "
                    "topladıktan SONRA çağır — istemcinin verdiği sayıları çiz."
                ),
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "type": types.Schema(
                            type=types.Type.STRING,
                            description="'bar' veya 'line'.",
                        ),
                        "title": types.Schema(type=types.Type.STRING),
                        "labels": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(type=types.Type.STRING),
                            description="X ekseni etiketleri (ör. tarihler, ürün isimleri).",
                        ),
                        "values": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(type=types.Type.NUMBER),
                            description="labels ile aynı uzunlukta sayısal değerler.",
                        ),
                        "unit": types.Schema(
                            type=types.Type.STRING,
                            description="Opsiyonel birim (ör. 'TRY', 'adet').",
                        ),
                    },
                    required=["type", "title", "labels", "values"],
                ),
            ),
        ]
    )
]
