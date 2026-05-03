const test = require('node:test');
const assert = require('node:assert/strict');

const loader = require('../rgdh-local-ekc-loader.js');

const EKC_TEXT = [
  'BIRIMIN ADI;ACWA KIRIKKALE',
  'TARIH;SAAT;BARA_GER_KV;BARA_GER_SET_DEG_KV;TOP_AKT_CIK_GUCU_MW;TOP_REAKT_CIK_GUCU_MVAR',
  '02.04.2026;00:00:00;158,1;158;5;1'
].join('\n');

function fileHandle(name, text = EKC_TEXT) {
  return {
    kind: 'file',
    name,
    async getFile() {
      return {
        name,
        size: text.length,
        type: 'text/csv',
        lastModified: 0,
        async text() {
          return text;
        }
      };
    }
  };
}

function countingFileHandle(name, options = {}) {
  const calls = { getFile: 0, text: 0 };
  const text = options.text || EKC_TEXT;
  const handle = {
    kind: 'file',
    name,
    calls,
    async getFile() {
      calls.getFile += 1;
      return {
        name,
        size: options.size ?? text.length,
        type: 'text/csv',
        lastModified: options.lastModified ?? 0,
        async text() {
          calls.text += 1;
          return text;
        }
      };
    }
  };
  return handle;
}

function directoryHandle(name, entries) {
  return {
    kind: 'directory',
    name,
    async *values() {
      for (const entry of entries) yield entry;
    }
  };
}

test('collectLocalEkcFilesFromDirectory recursively scans CSVs, filters by date and prefers RGDH_GUN duplicate', async () => {
  const duplicateText = EKC_TEXT;
  const otherDateText = EKC_TEXT.replaceAll('02.04.2026', '03.04.2026');
  const root = directoryHandle('TPYS_CSV_Standartlastirilmis', [
    directoryHandle('ACWA_04_26', [
      fileHandle('ACWA_02.04.2026.csv', duplicateText)
    ]),
    directoryHandle('nested', [
      directoryHandle('RGDH_GUN_02_04_26', [
        fileHandle('ACWA_02.04.2026.csv', duplicateText)
      ]),
      directoryHandle('RGDH_GUN_03_04_26', [
        fileHandle('ACWA_03.04.2026.csv', otherDateText)
      ])
    ]),
    fileHandle('readme.txt', 'not csv')
  ]);

  const result = await loader.collectLocalEkcFilesFromDirectory(root, {
    filters: { date: '2026-04-02', endDate: '2026-04-03' }
  });

  assert.equal(result.scannedFiles, 3);
  assert.equal(result.filteredOutFiles, 1);
  assert.equal(result.duplicateFiles, 1);
  assert.equal(result.files.length, 1);
  assert.match(result.files[0].localEkcPath, /RGDH_GUN_02_04_26\/ACWA_02\.04\.2026\.csv$/);
  assert.equal(await result.files[0].text(), duplicateText);
});

test('filterParsedEkcRows applies date range, source type and optional selected busbar without requiring selection', () => {
  const rows = [
    { localDate: '2026-04-02', busbarId: '4772', busbarName: 'KURTKAYASI RES', sourceType: 'WIND' },
    { localDate: '2026-04-03', busbarId: '5052', busbarName: 'GEYCEK RES', sourceType: 'WIND' },
    { localDate: '2026-04-04', busbarId: '4772', busbarName: 'KURTKAYASI RES', sourceType: 'WIND' },
    { localDate: '2026-04-02', busbarId: '5532', busbarName: 'ACWA', sourceType: 'CONVENTIONAL' }
  ];

  assert.deepEqual(
    loader.filterParsedEkcRows(rows, {
      filters: { date: '2026-04-02', endDate: '2026-04-04', sourceType: 'WIND' }
    }).map((row) => row.busbarName),
    ['KURTKAYASI RES', 'GEYCEK RES']
  );

  assert.deepEqual(
    loader.filterParsedEkcRows(rows, {
      filters: { date: '2026-04-02', endDate: '2026-04-04', sourceType: 'ALL' },
      selectedBusbar: { busbarId: '4772', busbarName: 'KURTKAYASI RES' }
    }).map((row) => row.busbarName),
    ['KURTKAYASI RES']
  );
});

test('collectLocalEkcFilesFromFileList supports webkitdirectory fallback input', async () => {
  const file = {
    name: 'ACWA_02.04.2026.csv',
    webkitRelativePath: 'TPYS_CSV_Standartlastirilmis/ACWA_04_26/ACWA_02.04.2026.csv',
    size: EKC_TEXT.length,
    type: 'text/csv',
    lastModified: 0,
    async text() {
      return EKC_TEXT;
    }
  };

  const result = await loader.collectLocalEkcFilesFromFileList([file], {
    filters: { date: '2026-04-02', endDate: '' }
  });

  assert.equal(result.scannedFiles, 1);
  assert.equal(result.files.length, 1);
  assert.equal(result.files[0].localEkcPath, file.webkitRelativePath);
});

test('collectLocalEkcFilesFromDirectory skips reading CSVs outside selected busbar path', async () => {
  const selected = countingFileHandle('CAYIRHAN_TES_380_02.04.2026.csv');
  const unrelated = countingFileHandle('ACWA_02.04.2026.csv');
  const root = directoryHandle('TPYS_CSV_Standartlastirilmis', [
    directoryHandle('CAYIRHAN_TES_380_04_26', [selected]),
    directoryHandle('ACWA_04_26', [unrelated])
  ]);

  const result = await loader.collectLocalEkcFilesFromDirectory(root, {
    filters: { date: '2026-04-02', endDate: '2026-04-03' },
    selectedBusbar: { busbarName: 'CAYIRHAN TES 380', plantName: 'CAYIRHAN TES' }
  });

  assert.equal(result.scannedFiles, 2);
  assert.equal(result.skippedByPath, 1);
  assert.equal(result.files.length, 1);
  assert.equal(selected.calls.text, 1);
  assert.equal(unrelated.calls.text, 0);
});

test('collectLocalEkcFilesFromDirectory skips date-filtered CSVs whose path has no date', async () => {
  const noDate = countingFileHandle('ACWA.csv');
  const root = directoryHandle('TPYS_CSV_Standartlastirilmis', [
    directoryHandle('ACWA_04_26', [noDate])
  ]);

  const result = await loader.collectLocalEkcFilesFromDirectory(root, {
    filters: { date: '2026-04-02', endDate: '' }
  });

  assert.equal(result.scannedFiles, 1);
  assert.equal(result.skippedByPath, 1);
  assert.equal(result.files.length, 0);
  assert.equal(noDate.calls.text, 0);
});

test('collectLocalEkcFilesFromDirectory yields and reports progress while scanning batches', async () => {
  const progress = [];
  const root = directoryHandle('TPYS_CSV_Standartlastirilmis', [
    directoryHandle('RGDH_GUN_02_04_26', [
      countingFileHandle('ACWA_02.04.2026.csv'),
      countingFileHandle('CAYIRHAN_TES_380_02.04.2026.csv'),
      countingFileHandle('GEYCEK_RES_02.04.2026.csv')
    ])
  ]);

  const result = await loader.collectLocalEkcFilesFromDirectory(root, {
    filters: { date: '2026-04-02', endDate: '' },
    batchSize: 1,
    onProgress: (event) => progress.push(event)
  });

  assert.equal(result.files.length, 3);
  assert.ok(progress.length >= 3);
  assert.ok(progress.some((event) => event.phase === 'scan'));
  assert.ok(progress.at(-1).readFiles >= 3);
});
