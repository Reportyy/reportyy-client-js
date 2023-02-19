// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import { describe, expect, it, beforeEach } from '@jest/globals';
import fs from 'fs';

import { ReportyyApiClient, ReportyyApiError } from '../src';

describe('ReportyyApiClient', () => {
  let apiClient: ReportyyApiClient;

  beforeEach(() => {
    apiClient = new ReportyyApiClient({
      apiKey: process.env.REPORTYY_API_KEY ?? '',
      baseUrl: process.env.REPORTYY_BASE_URL ?? '',
    });
  });

  describe('generatePdfSyncStream', () => {
    describe('when the API key is invalid', () => {
      it('should emit an error', (done) => {
        apiClient = new ReportyyApiClient({
          apiKey: 'invalid_key',
          baseUrl: process.env.REPORTYY_BASE_URL ?? '',
        });

        const pdfStream = apiClient.generatePdfSyncStream({
          templateId: 'cleakim7c00129882ha9ct56d',
          data: {},
        });

        pdfStream.on('error', (error) => {
          expect(error).toBeInstanceOf(ReportyyApiError);
          done();
        });
      });
    });

    describe('when params are valid', () => {
      it('should stream the PDF', (done) => {
        let hasErrored = false;

        const file = `generated-${Date.now()}.pdf`;
        const outputStream = fs.createWriteStream(file);
        const pdfStream = apiClient.generatePdfSyncStream({
          templateId: 'cleakim7c00129882ha9ct56d',
          data: {
            date: 'February 18th 2023',
            reportType: 'Daily report',
            reportHeader: 'Day',
            merchant: {
              id: 'c45d1500-2184',
              name: 'Reportyy Limited',
              address: {
                line1: 'Line 1',
                line2: null,
                town: 'London',
                postCode: 'E2 000',
              },
            },
            saleItems: [
              {
                date: 'February 7, 2023',
                value: '£14.00',
              },
            ],
            lineItems: [
              {
                title: 'Gross sales',
                value: '£14.00',
              },
              {
                title: 'Net sales',
                value: '£14.00',
              },
              {
                title: 'Cost of goods',
                value: '£-2.00',
              },
              {
                title: 'Fees',
                value: '£0.00',
              },
              {
                title: 'Gross profit',
                value: '£12.00',
              },
            ],
          },
        });

        pdfStream.pipe(outputStream);
        pdfStream.on('error', (error) => {
          hasErrored = true;
          done(new Error(error.message));
        });

        outputStream.on('close', () => {
          if (!hasErrored) {
            const stats = fs.statSync(file);

            expect(stats.size).toBeGreaterThan(0);
          }

          fs.unlinkSync(file);
          done();
        });
      });
    });
  });

  describe('generatePdfSync', () => {
    describe('when the API key is invalid', () => {
      it('should throw an error', async () => {
        apiClient = new ReportyyApiClient({
          apiKey: 'invalid_key',
          baseUrl: process.env.REPORTYY_BASE_URL ?? '',
        });

        await expect(
          apiClient.generatePdfSync({
            templateId: 'cleakim7c00129882ha9ct56d',
            data: {},
          }),
        ).rejects.toThrow(ReportyyApiError);
      });
    });

    describe('when the params are valid', () => {
      it('should return a Buffer', async () => {
        const result = await apiClient.generatePdfSync({
          templateId: 'cleakim7c00129882ha9ct56d',
          data: {
            date: 'February 18th 2023',
            reportType: 'Daily report',
            reportHeader: 'Day',
            merchant: {
              id: 'c45d1500-2184',
              name: 'Reportyy Limited',
              address: {
                line1: 'Line 1',
                line2: null,
                town: 'London',
                postCode: 'E2 000',
              },
            },
            saleItems: [
              {
                date: 'February 7, 2023',
                value: '£14.00',
              },
            ],
            lineItems: [
              {
                title: 'Gross sales',
                value: '£14.00',
              },
              {
                title: 'Net sales',
                value: '£14.00',
              },
              {
                title: 'Cost of goods',
                value: '£-2.00',
              },
              {
                title: 'Fees',
                value: '£0.00',
              },
              {
                title: 'Gross profit',
                value: '£12.00',
              },
            ],
          },
        });

        expect(result.byteLength).toBeGreaterThan(0);
      });
    });
  });
});
