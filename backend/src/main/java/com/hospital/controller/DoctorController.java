package com.hospital.controller;

import com.hospital.dto.AppointmentResponse;
import com.hospital.dto.AppointmentStatusUpdateRequest;
import com.hospital.dto.DoctorResponse;
import com.hospital.entity.Doctor;
import com.hospital.service.AppointmentService;
import com.hospital.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;

    // Public: patients browse/search doctors
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<DoctorResponse> getDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    // Doctor: view own appointments
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/doctors/me/appointments")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(Authentication authentication) {
        Doctor doctor = doctorService.getDoctorEntityByUserEmail(authentication.getName());
        return ResponseEntity.ok(appointmentService.getByDoctor(doctor.getId(), authentication));
    }

    // Doctor: accept/reject/complete an appointment
    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                appointmentService.updateStatus(authentication.getName(), id, request.getStatus()));
    }
}
