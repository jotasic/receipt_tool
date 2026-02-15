/**
 * Task 3.1-3.3 Usage Example
 * 
 * Demonstrates the new document type and report-document linking features
 */

import {
  createDocument,
  getDocumentsByType,
  createReport,
  linkDocumentToReport,
  unlinkDocumentFromReport,
  getReportDocumentIds,
  getReportsByDocumentId,
  getReportById,
} from '@/services/database';

/**
 * Example 1: Create documents with different types
 */
export async function example1_CreateDocumentsWithTypes() {
  // Create a medical document
  const medicalDoc = await createDocument({
    title: '진단서 - 홍길동',
    description: '2024년 2월 건강검진 진단서',
    filePath: '/documents/medical_2024_02.pdf',
    fileType: 'application/pdf',
    documentType: 'medical',
    memo: '회사 제출용',
  });

  // Create a certificate document
  const certificateDoc = await createDocument({
    title: '재직증명서',
    description: '회사 재직증명서',
    filePath: '/documents/certificate_abc_2024.pdf',
    fileType: 'application/pdf',
    documentType: 'certificate',
  });

  // Create another medical document
  const prescriptionDoc = await createDocument({
    title: '처방전 - 약국',
    documentType: 'medical',
  });

  // Create a document without specifying type (defaults to 'other')
  const otherDoc = await createDocument({
    title: '기타 문서',
    description: 'Type이 지정되지 않은 문서는 자동으로 other로 설정됩니다',
  });

  console.log('Created documents:', {
    medical: medicalDoc.documentType, // 'medical'
    certificate: certificateDoc.documentType, // 'certificate'
    prescription: prescriptionDoc.documentType, // 'medical'
    other: otherDoc.documentType, // 'other' (default)
  });

  return { medicalDoc, certificateDoc, prescriptionDoc, otherDoc };
}

/**
 * Example 2: Get documents by type
 */
export async function example2_GetDocumentsByType() {
  // Get all medical documents
  const medicalDocs = await getDocumentsByType('medical');
  console.log(`Found ${medicalDocs.length} medical documents`);

  // Get all certificate documents
  const certificateDocs = await getDocumentsByType('certificate');
  console.log(`Found ${certificateDocs.length} certificate documents`);

  // Get all other documents
  const otherDocs = await getDocumentsByType('other');
  console.log(`Found ${otherDocs.length} other documents`);

  return { medicalDocs, certificateDocs, otherDocs };
}

/**
 * Example 3: Create report with both receipts and documents
 */
export async function example3_CreateReportWithDocuments(
  receiptIds: string[],
  documentIds: string[]
) {
  // Create a report with both receipts and documents
  const report = await createReport({
    title: '2024년 2월 출장비 정산',
    receiptIds: receiptIds,
    documentIds: documentIds,
    totalAmount: 0,
    status: 'draft',
  });

  console.log('Created report:', {
    id: report.id,
    receiptCount: report.receiptIds.length,
    documentCount: report.documentIds.length,
  });

  return report;
}

/**
 * Example 4: Link and unlink documents to/from existing report
 */
export async function example4_ManageReportDocuments(
  reportId: string,
  documentId: string
) {
  // Link a document to an existing report
  await linkDocumentToReport(reportId, documentId);
  console.log(`Linked document ${documentId} to report ${reportId}`);

  // Get all document IDs for the report
  const documentIds = await getReportDocumentIds(reportId);
  console.log(`Report has ${documentIds.length} documents`);

  // Get updated report with document IDs
  const report = await getReportById(reportId);
  console.log('Report document IDs:', report?.documentIds);

  // Unlink the document
  await unlinkDocumentFromReport(reportId, documentId);
  console.log(`Unlinked document ${documentId} from report ${reportId}`);

  // Verify document was removed
  const updatedReport = await getReportById(reportId);
  console.log('Updated document IDs:', updatedReport?.documentIds);
}

/**
 * Example 5: Find all reports containing a specific document
 */
export async function example5_FindReportsByDocument(documentId: string) {
  const reports = await getReportsByDocumentId(documentId);
  
  console.log(`Found ${reports.length} reports containing document ${documentId}`);
  
  reports.forEach((report) => {
    console.log(`- ${report.title} (${report.status})`);
  });

  return reports;
}

/**
 * Example 6: Complete workflow - Create medical expense report
 */
export async function example6_CompleteWorkflow() {
  // Step 1: Create medical-related documents
  const medicalCertificate = await createDocument({
    title: '진단서 - 김철수',
    documentType: 'medical',
    description: '병원 진료 진단서',
    filePath: '/documents/medical_cert_20240215.pdf',
  });

  const medicalDetails = await createDocument({
    title: '세부내역서',
    documentType: 'medical',
    description: '병원 진료비 세부내역',
    filePath: '/documents/medical_detail_20240215.pdf',
  });

  // Step 2: Create report with documents
  const report = await createReport({
    title: '의료비 정산 - 2024년 2월',
    receiptIds: [], // Assume we have receipt IDs from hospital visits
    documentIds: [medicalCertificate.id, medicalDetails.id],
    totalAmount: 0,
    status: 'draft',
  });

  console.log('Medical expense report created:', {
    reportId: report.id,
    title: report.title,
    documents: report.documentIds,
  });

  // Step 3: Verify documents are linked
  const linkedDocs = await getReportDocumentIds(report.id);
  console.log('Linked documents:', linkedDocs);

  // Step 4: Find all reports with this medical certificate
  const relatedReports = await getReportsByDocumentId(medicalCertificate.id);
  console.log(
    `Medical certificate is used in ${relatedReports.length} report(s)`
  );

  return report;
}
