package com.hospital.repository;

import com.hospital.entity.Appointment;
import com.hospital.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId);
    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Long doctorId);

    // Used for ownership checks: has this doctor ever treated this patient?
    boolean existsByDoctorIdAndPatientId(Long doctorId, Long patientId);

    // Used to block double-booking the same doctor at the same date/time.
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long doctorId, LocalDate appointmentDate, LocalTime appointmentTime, List<AppointmentStatus> statuses);
}
