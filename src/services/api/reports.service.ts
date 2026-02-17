import { http } from "./http";
import type {
  ReportDefinitionResponse,
  PdfOrientation,
  ReportFormat,
  ReportPreviewResponse,
  ReportRunRequest,
} from "./types";

export async function listReportDefinitions(): Promise<ReportDefinitionResponse[]> {
  const { data } = await http.get<ReportDefinitionResponse[]>("/api/reports/definitions");
  return data;
}

export async function previewReport(
  reportKey: string,
  payload?: ReportRunRequest
): Promise<ReportPreviewResponse> {
  const { data } = await http.post<ReportPreviewResponse>(`/api/reports/${reportKey}/preview`, payload ?? {});
  return data;
}

type ExportResult = {
  blob: Blob;
  filename?: string;
};

export async function exportReport(
  reportKey: string,
  format: ReportFormat,
  orientation: PdfOrientation,
  payload?: ReportRunRequest
): Promise<ExportResult> {
  const response = await http.post<Blob>(`/api/reports/${reportKey}/export`, payload ?? {}, {
    params: { format, orientation },
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const filename = extractFilename(contentDisposition);

  return { blob: response.data, filename };
}

function extractFilename(contentDisposition?: string): string | undefined {
  if (!contentDisposition) return undefined;

  const utf8Match = contentDisposition.match(/filename\\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].trim());

  const basicMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  if (basicMatch?.[1]) return basicMatch[1].trim();

  return undefined;
}
