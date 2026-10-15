
package com.kloudspot.employeemanagement.service;

import com.kloudspot.employeemanagement.exception.ResourceNotFoundException;
import com.kloudspot.employeemanagement.model.Employee;
import com.kloudspot.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setEmployeeId("EMP001");
        employee.setFullName("John Doe");
        employee.setEmail("john@example.com");
        employee.setPhoneNumber("9876543210");
        employee.setDepartment("Engineering");
        employee.setDesignation("Software Engineer");
        employee.setDateOfJoining(LocalDate.of(2025, 1, 15));
        employee.setSalary(new BigDecimal("75000"));
        employee.setEmploymentStatus(Employee.EmploymentStatus.ACTIVE);
    }

    @Test
    void createEmployeeSuccessfully() {
        when(employeeRepository.existsByEmployeeId("EMP001"))
                .thenReturn(false);
        when(employeeRepository.existsByEmailIgnoreCase("john@example.com"))
                .thenReturn(false);
        when(employeeRepository.save(any(Employee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Employee result = employeeService.createEmployee(employee);

        assertEquals("EMP001", result.getEmployeeId());
        assertEquals("john@example.com", result.getEmail());
        verify(employeeRepository).save(employee);
    }

    @Test
    void createEmployeeRejectsDuplicateEmployeeId() {
        when(employeeRepository.existsByEmployeeId("EMP001"))
                .thenReturn(true);

        assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.createEmployee(employee)
        );

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createEmployeeRejectsDuplicateEmail() {
        when(employeeRepository.existsByEmployeeId("EMP001"))
                .thenReturn(false);
        when(employeeRepository.existsByEmailIgnoreCase("john@example.com"))
                .thenReturn(true);

        assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.createEmployee(employee)
        );

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createEmployeeRejectsInvalidEmail() {
        employee.setEmail("invalid-email");

        assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.createEmployee(employee)
        );

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createEmployeeRejectsNegativeSalary() {
        employee.setSalary(new BigDecimal("-100"));

        assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.createEmployee(employee)
        );

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createEmployeeNormalizesEmailAndWhitespace() {
        employee.setEmployeeId(" EMP001 ");
        employee.setFullName(" John Doe ");
        employee.setEmail(" JOHN@EXAMPLE.COM ");

        when(employeeRepository.existsByEmployeeId("EMP001"))
                .thenReturn(false);
        when(employeeRepository.existsByEmailIgnoreCase("john@example.com"))
                .thenReturn(false);
        when(employeeRepository.save(any(Employee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Employee result = employeeService.createEmployee(employee);

        assertEquals("EMP001", result.getEmployeeId());
        assertEquals("John Doe", result.getFullName());
        assertEquals("john@example.com", result.getEmail());
    }

    @Test
    void getEmployeeReturnsExistingEmployee() {
        employee.setId("mongo-id-1");

        when(employeeRepository.findById("mongo-id-1"))
                .thenReturn(Optional.of(employee));

        Employee result = employeeService.getEmployeeById("mongo-id-1");

        assertEquals("John Doe", result.getFullName());
    }

    @Test
    void getEmployeeThrowsResourceNotFoundWhenMissing() {
        when(employeeRepository.findById("missing"))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> employeeService.getEmployeeById("missing")
        );
    }

    @Test
    void deleteEmployeeDeletesExistingEmployee() {
        employee.setId("mongo-id-1");

        when(employeeRepository.findById("mongo-id-1"))
                .thenReturn(Optional.of(employee));

        employeeService.deleteEmployee("mongo-id-1");

        verify(employeeRepository).delete(employee);
    }

    @Test
    void updateEmployeeSuccessfully() {
        employee.setId("mongo-id-1");

        Employee updated = new Employee();
        updated.setEmployeeId("EMP001");
        updated.setFullName("John Updated");
        updated.setEmail("john@example.com");
        updated.setPhoneNumber("9876543210");
        updated.setDepartment("Engineering");
        updated.setDesignation("Senior Software Engineer");
        updated.setDateOfJoining(LocalDate.of(2025, 1, 15));
        updated.setSalary(new BigDecimal("85000"));
        updated.setEmploymentStatus(Employee.EmploymentStatus.ACTIVE);

        when(employeeRepository.findById("mongo-id-1"))
                .thenReturn(Optional.of(employee));
        when(employeeRepository.findByEmployeeId("EMP001"))
                .thenReturn(Optional.of(employee));
        when(employeeRepository.findByEmailIgnoreCase("john@example.com"))
                .thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Employee result = employeeService.updateEmployee("mongo-id-1", updated);

        assertEquals("John Updated", result.getFullName());
        assertEquals("Senior Software Engineer", result.getDesignation());
        assertEquals(new BigDecimal("85000"), result.getSalary());
        verify(employeeRepository).save(employee);
    }

    @Test
    void getEmployeesDelegatesSearchAndPaginationToRepository() {
        Page<Employee> expectedPage =
                new PageImpl<>(List.of(employee));

        when(employeeRepository.searchEmployees(
                eq("John"),
                eq("Engineering"),
                eq(Employee.EmploymentStatus.ACTIVE),
                any(Pageable.class)
        )).thenReturn(expectedPage);

        Page<Employee> result = employeeService.getEmployees(
                "John",
                "Engineering",
                Employee.EmploymentStatus.ACTIVE,
                0,
                10
        );

        assertEquals(1, result.getTotalElements());
        verify(employeeRepository).searchEmployees(
                eq("John"),
                eq("Engineering"),
                eq(Employee.EmploymentStatus.ACTIVE),
                any(Pageable.class)
        );
    }

    @Test
    void getEmployeesRejectsInvalidPageSize() {
        assertThrows(
                IllegalArgumentException.class,
                () -> employeeService.getEmployees(
                        null, null, null, 0, 0
                )
        );
    }
}
