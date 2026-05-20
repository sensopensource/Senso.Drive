# Tarifs Anthropic en $/M tokens.
# Source : tarification publique (a reviser si elle change).
TARIFS = {
    "claude-haiku-4-5":  {"in": 0.80,  "out": 4.00},
    "claude-sonnet-4-6": {"in": 3.00,  "out": 15.00},
    "claude-opus-4-7":   {"in": 15.00, "out": 75.00},
}


def cout_estime(modele: str, tokens_in: int, tokens_out: int) -> float:
    tarif = TARIFS.get(modele)
    if tarif is None:
        return 0.0
    cout_in = tokens_in / 1_000_000 * tarif["in"]
    cout_out = tokens_out / 1_000_000 * tarif["out"]
    return cout_in + cout_out
