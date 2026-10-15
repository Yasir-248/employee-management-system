
package com.kloudspot.employeemanagement.controller;

import com.kloudspot.employeemanagement.model.Employee;
import com.kloudspot.employeemanagement.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // Create a new employee.
    @PostMapping
    public ResponseEntity<Employee> createEmployee(
            @Valid @RequestBody Employee employee) {

        Employee createdEmployee =
                employeeService.createEmployee(employee);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createdEmployee);
    }

    // List employees with optional search, filters, and pagination.
    @GetMapping
    public ResponseEntity<Page<Employee>> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false)
            Employee.EmploymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Employee> employees = employeeService.getEmployees(
                search,
                department,
                status,
                page,
                size
        );

        return ResponseEntity.ok(employees);
    }

    // Retrieve an employee by ID.
    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployee(
            @PathVariable String id) {

        return ResponseEntity.ok(
                employeeService.getEmployeeById(id)
        );
    }

    // Update an existing employee.
    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(
            @PathVariable String id,
            @Valid @RequestBody Employee employee) {

        Employee updatedEmployee =
                employeeService.updateEmployee(id, employee);

        return ResponseEntity.ok(updatedEmployee);
    }

    // Delete an employee.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(
            @PathVariable String id) {

        employeeService.deleteEmployee(id);

        return ResponseEntity.noContent().build();
    }
}
