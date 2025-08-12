const normalize = (value) =>
  value?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';

export function buildFilter(query) {
  return (element) => {
    if (query.q) {
      const term = normalize(query.q);
      const hay = [element.name, element.symbol, element.category, element.appearance, element.summary]
        .filter(Boolean)
        .map(normalize)
        .some((v) => v.includes(term));
      if (!hay) return false;
    }
    if (query.symbol && normalize(element.symbol) !== normalize(query.symbol)) return false;
    if (query.number && element.number !== query.number) return false;
    if (query.group && element.group !== query.group) return false;
    if (query.period && element.period !== query.period) return false;
    if (query.category && normalize(element.category) !== normalize(query.category)) return false;
    if (query.state && element.phase !== query.state) return false;
    if (query.block && element.block !== query.block) return false;
    return true;
  };
}