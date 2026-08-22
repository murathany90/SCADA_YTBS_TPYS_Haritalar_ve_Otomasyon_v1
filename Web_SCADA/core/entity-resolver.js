(function (root, factory) {
  const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; root.WebSCADAEntityResolver = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const metricKey = { P: 'active', Q: 'reactive', U: 'voltage', S: 'apparent', I: 'current' };
  function entityType(entity) {
    if (entity?.kind !== 'trafo') return entity?.kind || '';
    return /iletim/i.test(String(entity.gerilimTuru || '')) ? 'trafo-transmission' : 'trafo-distribution';
  }
  function idsForEntity(entity, metrics) {
    const requested = (metrics || []).map(String); const ids = new Set();
    requested.forEach((metric) => (entity?.scada?.[metricKey[metric]]?.ids || []).forEach((id) => ids.add(String(id))));
    return [...ids];
  }
  function resolveMeasurementIds(entity, metrics, allEntities) {
    const direct = idsForEntity(entity, metrics); if (entity?.kind !== 'tm') return direct;
    const tmId = String(entity.id || ''); const children = (allEntities || []).filter((candidate) => String(candidate.tmId || '') === tmId);
    return [...new Set(children.flatMap((candidate) => idsForEntity(candidate, metrics)))];
  }
  function hasScadaMatch(entity) { return Object.values(entity?.scada || {}).some((metric) => Array.isArray(metric?.ids) && metric.ids.length); }
  return { metricKey, entityType, idsForEntity, resolveMeasurementIds, hasScadaMatch };
}));
