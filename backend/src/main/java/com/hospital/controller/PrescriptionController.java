package com.hospital.controller;

import com.hospital.dto.PrescriptionRequest;
import com.hospital.dto.PrescriptionResponse;
import com.hospital.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public ResponseEntity<PrescriptionResponse> create(@Valid @RequestBody PrescriptionRequest request,
                                                          Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(prescriptionService.create(authentication.getName(), request));
    }

    // Ownership is enforced inside the service: only the patient themselves, an
    // admin, or a doctor who has treated this patient may view their prescriptions.
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/patient/{id}")
    public ResponseEntity<List<PrescriptionResponse>> getByPatient(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.getByPatient(id, authentication));
    }
}
