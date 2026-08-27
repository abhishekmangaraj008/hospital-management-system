package com.hospital.service;

import com.hospital.dto.PatientResponse;
import com.hospital.dto.PatientUpdateRequest;
import com.hospital.entity.Doctor;
import com.hospital.entity.Patient;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Fetch a patient by id, but only if the caller is allowed to see them:
     * the patient themselves, an admin, or a doctor who has actually treated them.
     * This closes the gap where any authenticated user could pull any patient's
     * record just by guessing an id.
     */
    public PatientResponse getPatientById(Long id, Authentication authentication) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        authorizeAccess(patient, authentication);
        return toResponse(patient);
    }

    public PatientResponse getPatientByEmail(String email) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return toResponse(patient);
    }

    public Patient getPatientEntityByUserEmail(String email) {
        return patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PatientResponse updateMyProfile(String email, PatientUpdateRequest request) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setBloodGroup(request.getBloodGroup());

        if (request.getPhone() != null) {
            patient.getUser().setPhone(request.getPhone());
        }

        patient = patientRepository.save(patient);
        return toResponse(patient);
    }

    /** Throws AccessDeniedException unless the caller is the patient, an admin, or a treating doctor. */
    private void authorizeAccess(Patient patient, Authentication authentication) {
        if (SecurityUtils.hasRole(authentication, "ADMIN")) return;

        String requesterEmail = authentication.getName();
        if (patient.getUser().getEmail().equals(requesterEmail)) return;

        if (SecurityUtils.hasRole(authentication, "DOCTOR")) {
            Doctor doctor = doctorRepository.findByUserEmail(requesterEmail).orElse(null);
            if (doctor != null && appointmentRepository.existsByDoctorIdAndPatientId(doctor.getId(), patient.getId())) {
                return;
            }
        }

        throw new AccessDeniedException("You do not have permission to view this patient's information");
    }

    private PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .fullName(patient.getUser().getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .address(patient.getAddress())
                .bloodGroup(patient.getBloodGroup())
                .build();
    }
}
