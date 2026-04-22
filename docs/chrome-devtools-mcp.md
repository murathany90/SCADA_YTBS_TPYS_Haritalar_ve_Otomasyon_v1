# Chrome DevTools MCP

Bu repo `chrome-devtools-mcp` paketini dev dependency olarak tutar. Bu nedenle paket her oturumda yeniden kurulmak zorunda degildir; IDE sadece MCP server listesini yeniden okumak icin restart/rescan isteyebilir.

## Kurulum ve Kullanim

1. Bagimliliklari yukleyin:

```powershell
npm install
```

2. Chrome'u remote debugging ile acin:

```powershell
npm run chrome:debug
```

3. MCP server'i repo-local paketle baslatin:

```powershell
npm run mcp:chrome
```

4. Repo config'i destekleyen IDE'lerde `.mcp.json` dosyasindaki `chrome-devtools-mcp` server'i kullanin. Windows'ta bu config `cmd.exe /c npx --no-install ...` sarmalayicisini kullanir; calisan komut yine repo-local `chrome-devtools-mcp` paketidir.

## Notlar

- Antigravity/Gemini gibi IDE'ler user-level `mcp_config.json` dosyasini kullanabilir. Bu durumda repo config'i otomatik okunmuyorsa IDE ayarlarina `.mcp.json` icindeki server tanimini eklemek gerekir.
- Server `http://127.0.0.1:9222` adresindeki debug Chrome'a baglanir.
- CLI smoke kontrolu:

```powershell
npm run smoke:mcp
```
