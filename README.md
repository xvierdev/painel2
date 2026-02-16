# Painel2 com Docker + Cloudflared

Este diretório possui configuração para:

- Servir o `painel2` via `nginx` em container.
- Expor o painel na internet com `cloudflared`.

## Subir com Quick Tunnel (URL temporária)

```bash
cd painel2
docker compose --profile quick up -d --build
docker compose logs -f cloudflared
```

No log do `cloudflared` aparecerá a URL pública (`https://...trycloudflare.com`).

## Subir com túnel estável (token)

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Preencha no `.env`:

- `CLOUDFLARED_TUNNEL_TOKEN`
- `PANEL_API_KEY`
- (se necessário) `PANEL_API_UPSTREAM`

3. Suba os serviços:

```bash
docker compose --profile token up -d --build
```

## Parar

```bash
docker compose down
```

## Observação

O frontend chama ` /api/painel2 ` no próprio Nginx, e o Nginx encaminha para `PANEL_API_UPSTREAM` injetando `PANEL_API_KEY` no header.
Assim a chave não fica hardcoded no JavaScript.
