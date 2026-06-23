import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

/**
 * FhirService
 *
 * Builds FHIR R4 document bundles from MedSystem's internal data models.
 * These bundles are what gets shared via ABDM when patients consent to
 * share records with other providers.
 *
 * Spec: https://www.hl7.org/fhir/R4/
 * ABDM FHIR profile: https://nrces.in/ndhm/fhir/r4/
 */
@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);

  // ─── Discharge Summary (IPD) ──────────────────────────────────────────────

  buildDischargeSummary(data: {
    patient: any;
    admission: any;
    doctor?: any;
    medications?: any[];
    diagnostics?: any[];
  }): { bundleId: string; bundle: Record<string, any> } {
    const bundleId = uuidv4();
    const compositionId = uuidv4();

    const bundle = {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryDocument'],
      },
      identifier: { system: 'https://medsystem.io/fhir/bundles', value: bundleId },
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        this.buildCompositionEntry(compositionId, 'Discharge Summary', data),
        this.buildPatientEntry(data.patient),
        ...(data.doctor ? [this.buildPractitionerEntry(data.doctor)] : []),
        ...(data.medications ?? []).map(m => this.buildMedicationRequestEntry(m)),
        ...(data.diagnostics ?? []).map(d => this.buildDiagnosticReportEntry(d)),
      ],
    };

    this.logger.log(`Built Discharge Summary FHIR bundle ${bundleId}`);
    return { bundleId, bundle };
  }

  // ─── Diagnostic Report ────────────────────────────────────────────────────

  buildDiagnosticReport(data: {
    patient: any;
    booking: any;
    test: any;
    doctor?: any;
  }): { bundleId: string; bundle: Record<string, any> } {
    const bundleId = uuidv4();

    const bundle = {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord'],
      },
      identifier: { system: 'https://medsystem.io/fhir/bundles', value: bundleId },
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        this.buildPatientEntry(data.patient),
        this.buildDiagnosticReportEntry({
          bookingNumber: data.booking.booking_number,
          testName: data.test.name,
          testCode: data.test.test_code,
          results: data.booking.results,
          completedDate: data.booking.completed_date,
          status: 'final',
        }),
        ...(data.doctor ? [this.buildPractitionerEntry(data.doctor)] : []),
      ],
    };

    return { bundleId, bundle };
  }

  // ─── OPD Consultation ─────────────────────────────────────────────────────

  buildOpdConsultation(data: {
    patient: any;
    doctor: any;
    visitDate: string;
    chiefComplaint?: string;
    diagnosis?: string;
    medications?: any[];
  }): { bundleId: string; bundle: Record<string, any> } {
    const bundleId = uuidv4();

    const bundle = {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        this.buildPatientEntry(data.patient),
        this.buildPractitionerEntry(data.doctor),
        ...(data.medications ?? []).map(m => this.buildMedicationRequestEntry(m)),
      ],
    };

    return { bundleId, bundle };
  }

  // ─── FHIR Resource Builders ───────────────────────────────────────────────

  private buildPatientEntry(patient: any): Record<string, any> {
    return {
      fullUrl: `urn:uuid:${uuidv4()}`,
      resource: {
        resourceType: 'Patient',
        id: patient._id?.toString() ?? patient.patient_id,
        identifier: [
          {
            type: { coding: [{ system: 'https://healthid.ndhm.gov.in', code: 'HIN' }] },
            value: patient.abha_number ?? 'NOT_LINKED',
          },
          {
            type: { coding: [{ code: 'MR', display: 'Medical Record Number' }] },
            value: patient.patient_id,
          },
        ],
        name: [{
          use: 'official',
          text: `${patient.first_name} ${patient.last_name}`,
          family: patient.last_name,
          given: [patient.first_name],
        }],
        gender: this.mapGender(patient.gender),
        birthDate: patient.dob,
        telecom: patient.phone ? [{ system: 'phone', value: patient.phone }] : [],
      },
    };
  }

  private buildPractitionerEntry(doctor: any): Record<string, any> {
    return {
      fullUrl: `urn:uuid:${uuidv4()}`,
      resource: {
        resourceType: 'Practitioner',
        id: doctor._id?.toString() ?? doctor.employee_id,
        identifier: [{
          system: 'https://doctor.ndhm.gov.in',
          value: doctor.registration_no ?? doctor.employee_id,
        }],
        name: [{ text: doctor.name, use: 'official' }],
        qualification: [{
          code: { text: doctor.specialisation ?? doctor.department },
        }],
      },
    };
  }

  private buildMedicationRequestEntry(med: any): Record<string, any> {
    return {
      fullUrl: `urn:uuid:${uuidv4()}`,
      resource: {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{ display: med.medication_name ?? med.name }],
        },
        dosageInstruction: [{
          text: `${med.dosage ?? ''} ${med.frequency ?? ''}`.trim(),
        }],
      },
    };
  }

  private buildDiagnosticReportEntry(report: any): Record<string, any> {
    return {
      fullUrl: `urn:uuid:${uuidv4()}`,
      resource: {
        resourceType: 'DiagnosticReport',
        status: report.status ?? 'final',
        code: {
          coding: [{ display: report.testName ?? report.test_name ?? 'Lab Test' }],
          text: report.testCode ?? report.test_code,
        },
        effectiveDateTime: report.completedDate ?? report.completed_date,
        conclusion: report.results,
      },
    };
  }

  private buildCompositionEntry(
    compositionId: string,
    title: string,
    data: any,
  ): Record<string, any> {
    return {
      fullUrl: `urn:uuid:${compositionId}`,
      resource: {
        resourceType: 'Composition',
        id: compositionId,
        status: 'final',
        type: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '373942005',
            display: title,
          }],
        },
        date: new Date().toISOString(),
        title,
        section: [
          {
            title: 'Admission Details',
            text: {
              status: 'generated',
              div: `<div>${JSON.stringify(data.admission ?? {})}</div>`,
            },
          },
        ],
      },
    };
  }

  private mapGender(gender: string): string {
    const map: Record<string, string> = {
      M: 'male', F: 'female', O: 'other', U: 'unknown',
      male: 'male', female: 'female',
    };
    return map[gender] ?? 'unknown';
  }
}
