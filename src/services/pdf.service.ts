import PDFDocument from 'pdfkit';
import { MedicalReport } from '../types/index.js';

class PDFService {
  /**
   * Generate a PDF for a medical report
   */
  generateMedicalReportPDF(report: MedicalReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Medical Report - ${report.patientName}`,
            Author: report.doctorName,
            Subject: 'Medical Report',
            Creator: 'Oversabi Hospital Management System'
          }
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, report);

        // Patient Information
        this.addPatientInfo(doc, report);

        // Clinical Information
        this.addClinicalInfo(doc, report);

        // Vital Signs (if present)
        if (report.vitalSigns) {
          this.addVitalSigns(doc, report);
        }

        // Diagnosis & Treatment
        this.addDiagnosisTreatment(doc, report);

        // Medications (if present)
        if (report.medications && report.medications.length > 0) {
          this.addMedications(doc, report);
        }

        // Additional Information
        this.addAdditionalInfo(doc, report);

        // Footer
        this.addFooter(doc, report);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    // Hospital Name
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text(report.hospitalName, { align: 'center' });

    doc.moveDown(0.3);

    // Title
    doc.fontSize(16)
      .fillColor('#000000')
      .text('MEDICAL REPORT', { align: 'center' });

    doc.moveDown(0.3);

    // Report ID and Date
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Report ID: ${report.id}`, { align: 'center' });

    doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, { align: 'center' });

    // Horizontal line
    doc.moveDown(0.5);
    doc.strokeColor('#1e40af')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(1);
  }

  private addPatientInfo(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Patient Information');

    doc.moveDown(0.5);

    const leftCol = 50;
    const rightCol = 300;
    const startY = doc.y;

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    // Left column
    doc.text('Patient Name:', leftCol, startY);
    doc.font('Helvetica-Bold').text(report.patientName, leftCol + 100, startY);

    doc.font('Helvetica').text('Patient ID:', leftCol, startY + 20);
    doc.font('Helvetica-Bold').text(report.patientUniqueId, leftCol + 100, startY + 20);

    // Right column
    doc.font('Helvetica').text('Doctor:', rightCol, startY);
    doc.font('Helvetica-Bold').text(report.doctorName, rightCol + 80, startY);

    doc.font('Helvetica').text('Doctor ID:', rightCol, startY + 20);
    doc.font('Helvetica-Bold').text(report.doctorUniqueId, rightCol + 80, startY + 20);

    doc.y = startY + 50;
    doc.moveDown(1);

    // Divider
    doc.strokeColor('#e5e7eb').lineWidth(1)
      .moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.moveDown(1);
  }

  private addClinicalInfo(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Clinical Information');

    doc.moveDown(0.5);

    // Title
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Report Title:');
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(report.title);

    doc.moveDown(0.5);

    // Chief Complaint
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Chief Complaint:');
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(report.chiefComplaint);

    doc.moveDown(0.5);

    // Present Illness
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('History of Present Illness:');
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(report.presentIllness);

    // Past Medical History
    if (report.pastMedicalHistory) {
      doc.moveDown(0.5);
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Past Medical History:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.pastMedicalHistory);
    }

    // Family History
    if (report.familyHistory) {
      doc.moveDown(0.5);
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Family History:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.familyHistory);
    }

    // Social History
    if (report.socialHistory) {
      doc.moveDown(0.5);
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Social History:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.socialHistory);
    }

    // Physical Examination
    if (report.physicalExamination) {
      doc.moveDown(0.5);
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Physical Examination:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.physicalExamination);
    }

    doc.moveDown(1);
  }

  private addVitalSigns(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    const vitals = report.vitalSigns!;

    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Vital Signs');

    doc.moveDown(0.5);

    // Create a table-like structure
    const vitalsList: string[] = [];

    if (vitals.bloodPressure) vitalsList.push(`Blood Pressure: ${vitals.bloodPressure} mmHg`);
    if (vitals.heartRate) vitalsList.push(`Heart Rate: ${vitals.heartRate} bpm`);
    if (vitals.temperature) vitalsList.push(`Temperature: ${vitals.temperature}°C`);
    if (vitals.weight) vitalsList.push(`Weight: ${vitals.weight} kg`);
    if (vitals.height) vitalsList.push(`Height: ${vitals.height} cm`);
    if (vitals.oxygenSaturation) vitalsList.push(`Oxygen Saturation: ${vitals.oxygenSaturation}%`);

    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    vitalsList.forEach(vital => {
      doc.text(`• ${vital}`);
    });

    doc.moveDown(1);
  }

  private addDiagnosisTreatment(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Diagnosis & Treatment');

    doc.moveDown(0.5);

    // Diagnosis
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Diagnosis:');

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(report.diagnosis);

    if (report.diagnosisCode) {
      doc.fontSize(9)
        .fillColor('#666666')
        .text(`ICD-10 Code: ${report.diagnosisCode}`);
    }

    doc.moveDown(0.5);

    // Treatment
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Treatment Plan:');

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(report.treatment);

    doc.moveDown(1);
  }

  private addMedications(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Prescribed Medications');

    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    report.medications!.forEach((med, index) => {
      doc.font('Helvetica-Bold').text(`${index + 1}. ${med.name}`);
      doc.font('Helvetica')
        .text(`   Dosage: ${med.dosage}`)
        .text(`   Frequency: ${med.frequency}`)
        .text(`   Duration: ${med.duration}`);
      if (med.instructions) {
        doc.text(`   Instructions: ${med.instructions}`);
      }
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  private addAdditionalInfo(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    const hasAdditional = report.labResults || report.imaging || report.recommendations || report.followUpDate;

    if (!hasAdditional) return;

    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Additional Information');

    doc.moveDown(0.5);

    if (report.labResults) {
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Laboratory Results:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.labResults);
      doc.moveDown(0.5);
    }

    if (report.imaging) {
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Imaging Results:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.imaging);
      doc.moveDown(0.5);
    }

    if (report.recommendations) {
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Recommendations:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(report.recommendations);
      doc.moveDown(0.5);
    }

    if (report.followUpDate) {
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Follow-up Date:');
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(new Date(report.followUpDate).toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
    }

    doc.moveDown(1);
  }

  private addFooter(doc: PDFKit.PDFDocument, report: MedicalReport): void {
    // Move to bottom of page
    const bottomY = 750;

    // Signature line
    doc.strokeColor('#000000').lineWidth(1);
    doc.moveTo(350, bottomY).lineTo(545, bottomY).stroke();

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(report.doctorName, 350, bottomY + 5, { width: 195, align: 'center' });

    doc.fontSize(8)
      .fillColor('#666666')
      .text('Attending Physician', 350, bottomY + 18, { width: 195, align: 'center' });

    // Report Status
    const statusColor = report.status === 'final' ? '#059669' :
                        report.status === 'amended' ? '#d97706' : '#6b7280';

    doc.fontSize(8)
      .fillColor(statusColor)
      .text(`Status: ${report.status.toUpperCase()}`, 50, bottomY + 5);

    // Timestamp
    doc.fillColor('#666666')
      .text(`Generated: ${new Date().toLocaleString('en-NG')}`, 50, bottomY + 18);

    // Footer text
    doc.fontSize(7)
      .fillColor('#9ca3af')
      .text(
        'This document is electronically generated by Oversabi Hospital Management System. ' +
        'For verification, please contact the issuing hospital.',
        50, bottomY + 35,
        { width: 495, align: 'center' }
      );

    // If amended, show last edit info
    if (report.lastEditedBy && report.lastEditedAt) {
      doc.fontSize(7)
        .fillColor('#d97706')
        .text(
          `Last amended by ${report.lastEditedBy} on ${new Date(report.lastEditedAt).toLocaleString('en-NG')}`,
          50, bottomY + 50,
          { width: 495, align: 'center' }
        );
    }
  }

  /**
   * Generate a comprehensive PDF with all medical reports for a patient
   */
  async generatePatientHistoryPDF(
    patientName: string,
    patientUniqueId: string,
    reports: MedicalReport[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Medical History - ${patientName}`,
            Subject: 'Complete Medical History',
            Creator: 'Oversabi Hospital Management System'
          }
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Cover Page
        doc.fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('OVERSABI', { align: 'center' });

        doc.fontSize(12)
          .font('Helvetica')
          .fillColor('#666666')
          .text('Hospital Management System', { align: 'center' });

        doc.moveDown(3);

        doc.fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Complete Medical History', { align: 'center' });

        doc.moveDown(2);

        doc.fontSize(16)
          .font('Helvetica')
          .text(`Patient: ${patientName}`, { align: 'center' });

        doc.fontSize(14)
          .text(`ID: ${patientUniqueId}`, { align: 'center' });

        doc.moveDown(1);

        doc.fontSize(12)
          .fillColor('#666666')
          .text(`Total Records: ${reports.length}`, { align: 'center' });

        doc.text(`Generated: ${new Date().toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, { align: 'center' });

        // Add each report
        reports.forEach((report, index) => {
          doc.addPage();

          doc.fontSize(10)
            .fillColor('#666666')
            .text(`Report ${index + 1} of ${reports.length}`, { align: 'right' });

          this.addHeader(doc, report);
          this.addPatientInfo(doc, report);
          this.addClinicalInfo(doc, report);

          if (report.vitalSigns) {
            this.addVitalSigns(doc, report);
          }

          this.addDiagnosisTreatment(doc, report);

          if (report.medications && report.medications.length > 0) {
            this.addMedications(doc, report);
          }

          this.addAdditionalInfo(doc, report);
          this.addFooter(doc, report);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfService = new PDFService();
