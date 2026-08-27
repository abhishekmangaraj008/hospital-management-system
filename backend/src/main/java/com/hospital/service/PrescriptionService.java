package com.hospital.service;

import com.hospital.dto.PrescriptionRequest;
import com.hospital.dto.PrescriptionResponse;
import com.hospital.entity.Appointment;
import com.hospital.entity.AppointmentStatus;
import com.hospital.entity.Doctor;
import com.hospital.entity.Patient;
import com.hospital.entity.Prescription;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.PrescriptionRepository;
import com.hospital.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Transactional
    public PrescriptionResponse create(String doctorEmail, PrescriptionRequest request) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getUser().getEmail().equals(doctorEmail)) {
            throw new BadRequestException("You can only prescribe for your own appointments");
        }
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "A prescription can only be added once the appointment is marked completed (current status: "
                            + appointment.getStatus() + ")");
        }
        if (prescriptionRepository.findByAppointmentId(appointment.getId()).isPresent()) {
            throw new BadRequestException("A prescription already exists for this appointment");
        }

        Prescription prescription = Prescription.builder()
                .appointment(appointment)
                .diagnosis(request.getDiagnosis())
                .medicines(request.getMedicines())
                .notes(request.getNotes())
                .build();

        prescription = prescriptionRepository.save(prescription);
        return toResponse(prescription);
    }

    /** Only the patient themselves, a treating doctor, or an admin can view a patient's prescriptions. */
    public List<PrescriptionResponse> getByPatient(Long patientId, Authentication authentication) {
        if (!SecurityUtils.hasRole(authentication, "ADMIN")) {
            String email = authentication.getName();
            if (SecurityUtils.hasRole(authentication, "PATIENT")) {
                Patient patient = patientRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new AccessDeniedException("You can only view your own prescriptions");
                }
            } else if (SecurityUtils.hasRole(authentication, "DOCTOR")) {
                Doctor doctor = doctorRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                if (!appointmentRepository.existsByDoctorIdAndPatientId(doctor.getId(), patientId)) {
                    throw new AccessDeniedException("You do not have permission to view this patient's prescriptions");
                }
            } else {
                throw new AccessDeniedException("You do not have permission to view these prescriptions");
            }
        }
        return prescriptionRepository.findByAppointmentPatientIdOrderByIssuedDateDesc(patientId)
                .stream().map(this::toResponse).toList();
    }

    private PrescriptionResponse toResponse(Prescription p) {
        return PrescriptionResponse.builder()
                .id(p.getId())
                .appointmentId(p.getAppointment().getId())
                .patientName(p.getAppointment().getPatient().getUser().getFullName())
                .doctorName(p.getAppointment().getDoctor().getUser().getFullName())
                .diagnosis(p.getDiagnosis())
                .medicines(p.getMedicines())
                .notes(p.getNotes())
                .issuedDate(p.getIssuedDate())
                .build();
    }
}
