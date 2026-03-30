export interface ExportResult {
  success: boolean;
  buildVersion: number;
  exportPath: string;
  exportedAt: string;
  gameDataFile: string;
  assetManifestFile: string;
  validationSummary: {
    errors: number;
    warnings: number;
  };
}
