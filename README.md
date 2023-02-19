# reportyy-client-js

TypeScript/JavaScript Node.js client for the Reportyy API.

## Installation

With NPM
```bash
$ npm install @reportyy/client --save
```

With Yarn
```bash
$ yarn add @reportyy/client
```

## Usage

The `@reportyy/client` package provides 2 different ways to generate PDFs:

### Streaming

Streams the PDF into `PassThrough` stream. You could pipe the PDF stream directly to your express response, for example.

```typescript
import { ReportyyApiClient } from '@reportyy/client';
import express from 'express';

const app = express();
const client = new ReportyyApiClient({
  apiKey: '<<your api key>>',
});

app.get('/generate-sales-report', (req, res) => {
  const pdfStream = client.generatePdfSyncStream({
    templateId: 'clebgegxd000008mo47623vo9',
    data: {
      date: '12 Feb 2023',
      sales: '£1,000,000',
    },
  });

  res.type('application/pdf');
  pdfStream.pipe(res);
});

app.listen(3000, () => {
  console.log('🚀 Listening on port 3000');
});
```

### Buffer
Returns the PDF into a Buffer.

```typescript
import { ReportyyApiClient } from '@reportyy/client';
import express from 'express';
import fs from 'fs';

const app = express();
const client = new ReportyyApiClient({
  apiKey: '<<your api key>>',
});

app.get('/generate-sales-report', (req, res) => {
  const pdfBuffer = client.generatePdfSync({
    templateId: 'clebgegxd000008mo47623vo9',
    data: {
      date: '12 Feb 2023',
      sales: '£1,000,000',
    },
  });

  fs.writeFileSync('/tmp/sales-report.pdf', pdfBuffer);

  res.json({ status: 'ok' })
});

app.listen(3000, () => {
  console.log('🚀 Listening on port 3000');
});
```
