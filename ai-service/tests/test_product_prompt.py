from app.prompts.product_writer import build_user_prompt


def test_user_prompt_includes_name_and_tone():
    prompt = build_user_prompt(name="Pamuklu Tişört", tone="casual")
    assert "Pamuklu Tişört" in prompt
    assert "samimi" in prompt.lower() or "konuşur gibi" in prompt.lower()


def test_user_prompt_omits_unset_fields():
    prompt = build_user_prompt(name="Çelik Bardak")
    assert "SKU" not in prompt
    assert "Kategori" not in prompt
    assert "Anahtar kelimeler" not in prompt


def test_user_prompt_includes_optionals_when_present():
    prompt = build_user_prompt(
        name="Çelik Bardak",
        sku="CB-001",
        category="Mutfak",
        keywords="çift cidarlı, ısı yalıtımlı",
    )
    assert "CB-001" in prompt
    assert "Mutfak" in prompt
    assert "çift cidarlı" in prompt


def test_unknown_tone_falls_back_to_professional():
    prompt = build_user_prompt(name="X", tone="unknown")
    assert "Resmi" in prompt
