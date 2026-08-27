package com.hospital.controller;

import com.hospital.dto.AppointmentRequest;
import com.hospital.dto.AppointmentResponse;
import com.hospital.entity.Patient;
import com.hospital.service.AppointmentService;
import com.hospital.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final PatientService patientService;

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody AppointmentRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.bookAppointment(authentication.getName(), request));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(authentication.getName(), id));
    }

    // Ownership is enforced inside the service: patients only see their own list,
    // doctors only see a patient's list if they've actually treated them, admins see all.
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/patient/{id}")
    public ResponseEntity<List<AppointmentResponse>> getByPatient(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(appointmentService.getByPatient(id, authentication));
    }

    // Ownership is enforced inside the service: a doctor may only view their own
    // appointment list; admins see all; everyone else is denied.
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/doctor/{id}")
    public ResponseEntity<List<AppointmentResponse>> getByDoctor(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(appointmentService.getByDoctor(id, authentication));
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(Authentication authentication) {
        Patient patient = patientService.getPatientEntityByUserEmail(authentication.getName());
        return ResponseEntity.ok(appointmentService.getByPatient(patient.getId(), authentication));
    }

    // NOTE: status updates (accept/reject/complete) live in DoctorController
    // at PUT /api/appointments/{id}/status, restricted to the assigned doctor.
}
