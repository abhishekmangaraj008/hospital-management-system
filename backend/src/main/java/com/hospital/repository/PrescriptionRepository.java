package com.hospital.repository;

import com.hospital.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByAppointmentPatientIdOrderByIssuedDateDesc(Long patientId);
    Optional<Prescription> findByAppointmentId(Long appointmentId);
}
