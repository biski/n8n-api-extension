# n8n Data Service

Minimalny serwis API rozszerzający n8n o dwie główne funkcje: pobieranie transkryptów z YouTube oraz ekstrakcję czytelnej treści artykułów.

## Funkcjonalności

- YouTube Transcript: formaty `json`, `text`, `srt`, `vtt`
- Article Extract: czysty tekst + podstawowe metadane (tytuł, byline, excerpt, siteName)

## Szybka instalacja

```bash
git clone git@github.com:biski/n8n-api-extension.git
cd n8n-api-extension
cp .env.example .env   # ustaw własny API_TOKEN
npm install
```

Alternatywnie przez HTTPS:

```bash
git clone https://github.com/biski/n8n-api-extension.git
cd n8n-api-extension
cp .env.example .env
npm install
```

Przykład `.env` (minimum):

```env
PORT=3000
API_TOKEN=twoj-bardzo-losowy-token
NODE_ENV=production
```

Generowanie silnego tokenu:

```bash
openssl rand -base64 32
```

### Uruchomienie (dev)

```bash
npm run dev
```

### Uruchomienie (prod)

```bash
npm run build
npm run start:prod
```

Serwis będzie pod: `http://localhost:3000`

## Docker / Deploy na serwer

Budowa obrazu:

```bash
npm run docker:build
```

Uruchomienie przez docker-compose:

```bash
npm run docker:run
```

Zatrzymanie / logi:

```bash
npm run docker:logs
npm run docker:stop
```

W produkcji najczęściej: reverse proxy (NGINX / Traefik) przed kontenerem + ustawienie `API_TOKEN` w sekrecie.

## Uwierzytelnianie

Każde żądanie wymaga nagłówka:

```text
Authorization: Bearer <API_TOKEN>
```

## Endpointy

### YouTube Transcript

`GET /youtube/transcript/:videoId?format=json|text|srt|vtt`

Przykłady:

```bash
curl -H "Authorization: Bearer $API_TOKEN" \
  http://localhost:3000/youtube/transcript/dQw4w9WgXcQ

curl -H "Authorization: Bearer $API_TOKEN" \
  "http://localhost:3000/youtube/transcript/dQw4w9WgXcQ?format=srt"
```

Przykładowa odpowiedź JSON:

```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "format": "json",
  "transcript": [
    { "text": "Przykładowy caption", "start": "0", "dur": "2.5" }
  ]
}
```

### Article Extract

`POST /article/extract` body: `{ "url": "https://example.com/artykul" }`

```bash
curl -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/article"}' \
  http://localhost:3000/article/extract
```

Przykładowa odpowiedź:

```json
{
  "success": true,
  "url": "https://example.com/article",
  "title": "Tytuł artykułu",
  "content": "Wyczyszczona treść artykułu...",
  "excerpt": "Krótki opis",
  "byline": "Autor",
  "length": 1500,
  "siteName": "Example Site"
}
```


## Błędy

Standardowy format:

```json
{ "success": false, "error": "Opis błędu" }
```

## Licencja

MIT (zobacz `LICENSE`).

## Minimalne kroki wdrożenia na serwer

1. Ustaw silny `API_TOKEN` w `.env` lub managerze sekretów.
2. Zbuduj obraz (`npm run docker:build`) i uruchom kontener.
3. Podepnij reverse proxy z HTTPS.
4. Wykonaj szybki test curl dla obu endpointów.

To wszystko – reszta to już integracja z Twoimi workflow w n8n.
