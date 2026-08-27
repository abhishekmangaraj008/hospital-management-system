package com.hospital.controller;

import com.hospital.dto.PatientResponse;
import com.hospital.dto.PatientUpdateRequest;
import com.hospital.dto.PrescriptionResponse;
import com.hospital.entity.Patient;
import com.hospital.service.PatientService;
import com.hospital.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final PrescriptionService prescriptionService;

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/me")
    public ResponseEntity<PatientResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(patientService.getPatientByEmail(authentication.getName()));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/me")
    public ResponseEntity<PatientResponse> updateMyProfile(@Valid @RequestBody PatientUpdateRequest request,
                                                             Authentication authentication) {
        return ResponseEntity.ok(patientService.updateMyProfile(authentication.getName(), request));
    }

    // Ownership is enforced inside the service: only the patient themselves, an
    // admin, or a doctor who has actually treated this patient may view it.
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatient(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(patientService.getPatientById(id, authentication));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> getMyPrescriptions(Authentication authentication) {
        Patient patient = patientService.getPatientEntityByUserEmail(authentication.getName());
        return ResponseEntity.ok(prescriptionService.getByPatient(patient.getId(), authentication));
    }
}
