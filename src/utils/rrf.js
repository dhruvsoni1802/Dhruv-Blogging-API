export function reciprocalRankFusion(rankedLists, { k = 60 } = {}) {
  const scores = new Map();
  const items = new Map();

  for (const list of rankedLists) {
    if (!list?.length) continue;

    list.forEach((item, index) => {
      const id = item.id;
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
      if (!items.has(id)) {
        items.set(id, item);
      }
    });
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, rrfScore]) => ({
      ...items.get(id),
      rrfScore,
    }));
}
