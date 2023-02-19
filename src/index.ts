import https from 'https';
import stream from 'stream';

const OK_STATUS = 200;
const BASE_URL = process.env.REPORTYY_BASE_URL ?? 'api.reportyy.com';

export type ReportyyApiClientConstructorParams = {
  apiKey: string;
  baseUrl?: string | undefined;
};

export type GeneratePdfSyncParams = {
  templateId: string;
  data: Record<string, unknown>;
};

export type ReportyyApiErrorPayload = {
  status: number;
  code: number;
  message: string;
};

export class ReportyyApiError extends Error {
  constructor(message: string, readonly payload?: ReportyyApiErrorPayload) {
    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
  }
}

export class ReportyyApiClient {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;

  constructor({ apiKey, baseUrl }: ReportyyApiClientConstructorParams) {
    this._apiKey = apiKey;
    this._baseUrl = baseUrl ?? BASE_URL;
  }

  generatePdfSync({
    templateId,
    data,
  }: GeneratePdfSyncParams): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      let hasErrored = false;
      const chunks: Buffer[] = [];

      const request = https.request(
        {
          host: this._baseUrl,
          path: `/api/v1/templates/${templateId}/generate-sync`,
          method: 'POST',
          headers: {
            Accept: 'application/pdf',
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `API-Key ${this._apiKey}`,
          },
        },
        (res) => {
          if (res.statusCode !== OK_STATUS) {
            hasErrored = true;
            res.resume();
          }

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('error', (error) => {
            reject(error);
          });

          res.on('close', () => {
            const result = Buffer.concat(chunks);

            if (hasErrored) {
              try {
                const payload = JSON.parse(result.toString('utf-8'));
                reject(
                  new ReportyyApiError(
                    `HTTP Error: ${res.statusMessage}`,
                    payload,
                  ),
                );
              } catch (error) {
                reject(
                  new ReportyyApiError(`HTTP Error: ${res.statusMessage}`),
                );
              }
            }

            resolve(result);
          });
        },
      );

      request.write(JSON.stringify(data));
      request.end();

      request.on('error', (err) => {
        reject(new ReportyyApiError(`Error making request: ${err.message}`));
      });
    });
  }

  generatePdfSyncStream({
    templateId,
    data,
  }: GeneratePdfSyncParams): stream.PassThrough {
    const pdfStream = new stream.PassThrough();
    const request = https.request(
      {
        host: this._baseUrl,
        path: `/api/v1/templates/${templateId}/generate-sync`,
        method: 'POST',
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json; charset=UTF-8',
          Authorization: `API-Key ${this._apiKey}`,
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          pdfStream.emit(
            'error',
            new ReportyyApiError(`HTTP error: ${res.statusMessage}`),
          );
          pdfStream.push(null);

          return;
        }

        res.on('data', (chunk) => {
          pdfStream.push(chunk);
        });

        res.on('error', (error) => {
          pdfStream.emit('error', error);
        });

        res.on('close', () => {
          pdfStream.push(null);
        });
      },
    );

    request.write(JSON.stringify(data));
    request.end();

    request.on('error', (err) => {
      pdfStream.emit('error', err);
    });

    return pdfStream;
  }
}
