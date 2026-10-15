
package com.kloudspot.employeemanagement.repository;

import com.kloudspot.employeemanagement.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Repository
public class EmployeeSearchRepositoryImpl implements EmployeeSearchRepository {

    private final MongoTemplate mongoTemplate;

    public EmployeeSearchRepositoryImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Page<Employee> searchEmployees(
            String search,
            String department,
            Employee.EmploymentStatus status,
            Pageable pageable) {

        List<Criteria> filters = new ArrayList<>();

        // Search by employee name or email, ignoring case.
        if (search != null && !search.isBlank()) {
            String escapedSearch = Pattern.quote(search.trim());

            filters.add(new Criteria().orOperator(
                    Criteria.where("fullName").regex(escapedSearch, "i"),
                    Criteria.where("email").regex(escapedSearch, "i")
            ));
        }

        // Filter by department, ignoring case.
        if (department != null && !department.isBlank()) {
            String escapedDepartment =
                    "^" + Pattern.quote(department.trim()) + "$";

            filters.add(
                    Criteria.where("department")
                            .regex(escapedDepartment, "i")
            );
        }

        // Filter by employment status.
        if (status != null) {
            filters.add(
                    Criteria.where("employmentStatus").is(status)
            );
        }

        Query query = new Query();

        // Apply all supplied filters together.
        if (!filters.isEmpty()) {
            query.addCriteria(
                    new Criteria().andOperator(
                            filters.toArray(new Criteria[0])
                    )
            );
        }

        // Count all matching records before applying pagination.
        long total = mongoTemplate.count(query, Employee.class);

        // Apply page number, page size, and sorting.
        query.with(pageable);

        List<Employee> employees =
                mongoTemplate.find(query, Employee.class);

        return new PageImpl<>(employees, pageable, total);
    }
}
