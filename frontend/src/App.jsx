
import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const EMPTY_FORM = {
  employeeId: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  department: '',
  designation: '',
  dateOfJoining: '',
  salary: '',
  employmentStatus: 'ACTIVE',
}

const formatSalary = (salary) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(salary || 0))

const initials = (name = '') =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || '')
        .join('')
        .toUpperCase()

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m7 10 5 5 5-5" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    filter: <><path d="M4 7h16M7 12h10M10 17h4" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" /></>,
  }

  return <svg {...common}>{paths[name] || paths.grid}</svg>
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
      <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
      >
        <section
            className={`modal ${wide ? 'modal-wide' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
          <header className="modal-header">
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close dialog">
              <Icon name="close" />
            </button>
          </header>
          {children}
        </section>
      </div>
  )
}

function EmployeeForm({ employee, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
      employee ? { ...employee, salary: String(employee.salary ?? '') } : { ...EMPTY_FORM },
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (Number(form.salary) < 0) {
      setError('Salary cannot be negative.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
        employeeId: form.employeeId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
      }

      const response = await fetch(
          employee ? `${API_URL}/employees/${employee.id}` : `${API_URL}/employees`,
          {
            method: employee ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
          },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const details = data.errors
            ? Object.values(data.errors).join(' ')
            : data.message || data.error

        throw new Error(details || `Request failed (${response.status})`)
      }

      onSaved(data)
    } catch (err) {
      setError(err.message || 'Unable to save employee. Check that the backend is running.')
    } finally {
      setSaving(false)
    }
  }

  return (
      <Modal
          title={employee ? 'Edit employee' : 'Add employee'}
          subtitle={
            employee
                ? 'Update the employee information below.'
                : 'Enter the details to create a new employee record.'
          }
          onClose={onClose}
          wide
      >
        <form className="employee-form" onSubmit={submit}>
          <div className="form-section-title">Personal information</div>

          <div className="form-grid">
            <label>
              Employee ID <span>*</span>
              <input name="employeeId" value={form.employeeId} onChange={update} placeholder="e.g. EMP002" required maxLength={40} />
            </label>

            <label>
              Full name <span>*</span>
              <input name="fullName" value={form.fullName} onChange={update} placeholder="Enter full name" required maxLength={100} />
            </label>

            <label>
              Email address <span>*</span>
              <input type="email" name="email" value={form.email} onChange={update} placeholder="name@company.com" required />
            </label>

            <label>
              Phone number <span>*</span>
              <input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={update} placeholder="+919876543210" pattern="[+]?[0-9]{10,15}" title="Enter 10–15 digits, optionally beginning with +" required />
            </label>
          </div>

          <div className="form-section-title">Employment information</div>

          <div className="form-grid">
            <label>
              Department <span>*</span>
              <input name="department" value={form.department} onChange={update} placeholder="e.g. Engineering" required />
            </label>

            <label>
              Designation <span>*</span>
              <input name="designation" value={form.designation} onChange={update} placeholder="e.g. Software Engineer" required />
            </label>

            <label>
              Date of joining <span>*</span>
              <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={update} required />
            </label>

            <label>
              Annual salary (₹) <span>*</span>
              <input type="number" name="salary" value={form.salary} onChange={update} placeholder="e.g. 650000" min="0" step="0.01" required />
            </label>

            <label>
              Employment status <span>*</span>
              <select name="employmentStatus" value={form.employmentStatus} onChange={update} required>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <footer className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? 'Saving…' : employee ? 'Save changes' : 'Create employee'}
            </button>
          </footer>
        </form>
      </Modal>
  )
}

function EmployeeDetails({ employee, onClose, onEdit }) {
  const fields = [
    ['Employee ID', employee.employeeId],
    ['Email address', employee.email],
    ['Phone number', employee.phoneNumber],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Date of joining', employee.dateOfJoining],
    ['Salary', formatSalary(employee.salary)],
    ['Status', employee.employmentStatus],
  ]

  return (
      <Modal title="Employee details" subtitle="Complete employee record" onClose={onClose}>
        <div className="details-profile">
          <div className="avatar avatar-large">{initials(employee.fullName)}</div>
          <div>
            <h3>{employee.fullName}</h3>
            <p>{employee.designation}</p>
            <span className={`status-badge ${employee.employmentStatus === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
            <span className="status-dot" />{employee.employmentStatus}
          </span>
          </div>
        </div>

        <div className="details-grid">
          {fields.map(([label, value]) => (
              <div className="detail-item" key={label}>
                <span>{label}</span>
                <strong>{value || '—'}</strong>
              </div>
          ))}
        </div>

        <footer className="modal-actions">
          <button className="button button-secondary" onClick={onClose}>Close</button>
          <button className="button button-primary" onClick={() => onEdit(employee)}>
            <Icon name="edit" size={16} /> Edit employee
          </button>
        </footer>
      </Modal>
  )
}

function DeleteDialog({ employee, onClose, onConfirm, deleting }) {
  return (
      <Modal title="Delete employee?" subtitle="This action cannot be undone." onClose={onClose}>
        <div className="delete-content">
          <div className="delete-symbol"><Icon name="trash" size={24} /></div>
          <p>
            Are you sure you want to delete <strong>{employee.fullName}</strong> ({employee.employeeId})?
          </p>
          <p className="muted">This employee record will be permanently removed.</p>
        </div>

        <footer className="modal-actions">
          <button className="button button-secondary" onClick={onClose}>Cancel</button>
          <button className="button button-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete employee'}
          </button>
        </footer>
      </Modal>
  )
}

function App() {
  const [employees, setEmployees] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [formEmployee, setFormEmployee] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [detailsEmployee, setDetailsEmployee] = useState(null)
  const [deleteEmployee, setDeleteEmployee] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setApiError('')

    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      })

      if (search) params.set('search', search)
      if (department) params.set('department', department)
      if (status) params.set('status', status)

      const response = await fetch(`${API_URL}/employees?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`)
      }

      setEmployees(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setApiError(
          `${err.message || 'Unable to load employees.'} Make sure the Spring Boot API is running on port 8080.`,
      )
      setEmployees([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, department, status])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    if (!toast) return undefined

    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const notify = (message) => setToast(message)

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setDepartment('')
    setStatus('')
    setPage(0)
  }

  const savedEmployee = (employee) => {
    const wasEditing = Boolean(formEmployee)

    setFormOpen(false)
    setFormEmployee(null)
    setDetailsEmployee(null)
    notify(wasEditing ? 'Employee updated successfully.' : 'Employee created successfully.')

    // Return to the first page after a create/update, then reload via the effect.
    setPage(0)

    // If already on page zero, the page state will not change, so reload directly.
    if (page === 0) {
      loadEmployees()
    }
  }

  const confirmDelete = async () => {
    if (!deleteEmployee || deleting) return

    const employeeIdToDelete = deleteEmployee.id
    setDeleting(true)

    try {
      const response = await fetch(
          `${API_URL}/employees/${employeeIdToDelete}`,
          { method: 'DELETE' },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Delete failed (${response.status})`)
      }

      // Immediately remove only the employee whose ID was deleted.
      setEmployees((current) =>
          current.filter((employee) => employee.id !== employeeIdToDelete),
      )
      setTotalElements((current) => Math.max(0, current - 1))
      setDeleteEmployee(null)
      notify('Employee deleted successfully.')

      if (employees.length === 1 && page > 0) {
        // The effect reloads the previous page after this state change.
        setPage((current) => current - 1)
      } else {
        // Re-fetch the authoritative list and pagination metadata from the API.
        await loadEmployees()
      }
    } catch (err) {
      notify(err.message || 'Unable to delete employee.')
      await loadEmployees()
    } finally {
      setDeleting(false)
    }
  }

  const openEdit = (employee) => {
    setDetailsEmployee(null)
    setFormEmployee(employee)
    setFormOpen(true)
  }

  const departments = [...new Set(
      employees.map((employee) => employee.department).filter(Boolean),
  )].sort()

  const activeCount = employees.filter(
      (employee) => employee.employmentStatus === 'ACTIVE',
  ).length

  const inactiveCount = employees.filter(
      (employee) => employee.employmentStatus === 'INACTIVE',
  ).length

  return (
      <div className="app-shell">
        <aside className="sidebar">
          <a href="#" className="brand" onClick={(event) => event.preventDefault()}>
            <div className="brand-mark"><Icon name="users" size={23} /></div>
            <div className="brand-copy">
              <strong>People<span>Desk</span></strong>
              <small>EMPLOYEE PORTAL</small>
            </div>
          </a>

          <div className="nav-caption">WORKSPACE</div>

          <button className="nav-link nav-link-active" onClick={resetFilters}>
            <Icon name="grid" /><span>Overview</span>
          </button>

          <button className="nav-link" onClick={resetFilters}>
            <Icon name="users" /><span>All employees</span>
            <span className="nav-count">{totalElements}</span>
          </button>

          <div className="sidebar-bottom">
            <div className="help-card">
              <div className="help-icon"><Icon name="briefcase" size={20} /></div>
              <strong>People operations</strong>
              <p>Manage your team and keep employee records up to date.</p>
            </div>

            <div className="sidebar-user">
              <div className="avatar avatar-small">AD</div>
              <div>
                <strong>Administrator</strong>
                <small>Workspace admin</small>
              </div>
              <span className="online-dot" />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div className="breadcrumb">
              <span>Workspace</span><Icon name="chevron" size={14} /><strong>Employees</strong>
            </div>
            <div className="topbar-right">
              <span className="system-status"><span /> System online</span>
              <div className="avatar avatar-small">AD</div>
            </div>
          </header>

          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">PEOPLE OPERATIONS</div>
                <h1>Employee directory</h1>
                <p>Manage your people, their roles, and employment details.</p>
              </div>

              <button
                  className="button button-primary add-button"
                  onClick={() => {
                    setFormEmployee(null)
                    setFormOpen(true)
                  }}
              >
                <Icon name="plus" size={18} /> Add employee
              </button>
            </div>

            <section className="stats-grid" aria-label="Employee statistics">
              <article className="stat-card">
                <div className="stat-top">
                  <span>Total employees</span>
                  <div className="stat-icon stat-icon-blue"><Icon name="users" /></div>
                </div>
                <strong>{loading ? '—' : totalElements}</strong>
                <p>Matching current filters</p>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Active on this page</span>
                  <div className="stat-icon stat-icon-green"><span className="status-dot" /></div>
                </div>
                <strong>{loading ? '—' : activeCount}</strong>
                <p>Currently active employees</p>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Inactive on this page</span>
                  <div className="stat-icon stat-icon-amber"><Icon name="briefcase" /></div>
                </div>
                <strong>{loading ? '—' : inactiveCount}</strong>
                <p>Inactive employee records</p>
              </article>
            </section>

            <section className="directory-card">
              <div className="directory-heading">
                <div>
                  <h2>All employees</h2>
                  <p>View and manage employee records</p>
                </div>
                <button
                    className="button button-secondary refresh-button"
                    onClick={loadEmployees}
                    disabled={loading}
                >
                  <Icon name="refresh" size={16} /> Refresh
                </button>
              </div>

              <div className="filters-row">
                <form className="search-box" onSubmit={handleSearch}>
                  <Icon name="search" size={18} />
                  <input
                      aria-label="Search employees"
                      placeholder="Search by name or email..."
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                  />

                  {searchInput && (
                      <button
                          type="button"
                          className="clear-search"
                          onClick={() => {
                            setSearchInput('')
                            setSearch('')
                            setPage(0)
                          }}
                          aria-label="Clear search"
                      >
                        <Icon name="close" size={15} />
                      </button>
                  )}

                  <button type="submit" className="search-submit">Search</button>
                </form>

                <label className="filter-control">
                  <Icon name="filter" size={17} />
                  <select
                      aria-label="Filter by department"
                      value={department}
                      onChange={(event) => {
                        setDepartment(event.target.value)
                        setPage(0)
                      }}
                  >
                    <option value="">All departments</option>
                    {departments.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <Icon name="down" size={14} />
                </label>

                <label className="filter-control">
                  <select
                      aria-label="Filter by status"
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value)
                        setPage(0)
                      }}
                  >
                    <option value="">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <Icon name="down" size={14} />
                </label>

                {(search || department || status) && (
                    <button className="text-button" onClick={resetFilters}>Clear filters</button>
                )}
              </div>

              {apiError && (
                  <div className="api-error" role="alert">
                    <div>
                      <strong>Could not connect to the employee API</strong>
                      <p>{apiError}</p>
                    </div>
                    <button className="button button-secondary" onClick={loadEmployees}>Retry</button>
                  </div>
              )}

              <div className="table-scroll">
                <table className="employee-table">
                  <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>EMPLOYEE ID</th>
                    <th>DEPARTMENT</th>
                    <th>DESIGNATION</th>
                    <th>STATUS</th>
                    <th>SALARY</th>
                    <th className="actions-heading">ACTIONS</th>
                  </tr>
                  </thead>

                  <tbody>
                  {loading ? (
                      <tr>
                        <td colSpan="7">
                          <div className="table-state"><span className="spinner" /> Loading employees…</div>
                        </td>
                      </tr>
                  ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan="7">
                          <div className="table-state empty-state">
                            <div className="empty-icon"><Icon name="users" size={25} /></div>
                            <strong>{apiError ? 'Employee list unavailable' : 'No employees found'}</strong>
                            <p>{apiError ? 'Check the API connection and retry.' : 'Try changing your filters or add a new employee.'}</p>
                            {!apiError && (
                                <button
                                    className="button button-primary"
                                    onClick={() => {
                                      setFormEmployee(null)
                                      setFormOpen(true)
                                    }}
                                >
                                  <Icon name="plus" size={16} /> Add employee
                                </button>
                            )}
                          </div>
                        </td>
                      </tr>
                  ) : employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <button className="employee-person" onClick={() => setDetailsEmployee(employee)}>
                            <span className="avatar employee-avatar">{initials(employee.fullName)}</span>
                            <span className="employee-person-copy">
                            <strong>{employee.fullName}</strong>
                            <small>{employee.email}</small>
                          </span>
                          </button>
                        </td>

                        <td><span className="employee-id">{employee.employeeId}</span></td>
                        <td><span className="department-label">{employee.department}</span></td>
                        <td className="designation-cell">{employee.designation}</td>

                        <td>
                        <span className={`status-badge ${employee.employmentStatus === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                          <span className="status-dot" />
                          {employee.employmentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                        </td>

                        <td className="salary-cell">{formatSalary(employee.salary)}</td>

                        <td>
                          <div className="row-actions">
                            <button className="icon-button" title="View details" aria-label={`View ${employee.fullName}`} onClick={() => setDetailsEmployee(employee)}>
                              <Icon name="eye" size={17} />
                            </button>
                            <button className="icon-button" title="Edit employee" aria-label={`Edit ${employee.fullName}`} onClick={() => openEdit(employee)}>
                              <Icon name="edit" size={16} />
                            </button>
                            <button className="icon-button icon-danger" title="Delete employee" aria-label={`Delete ${employee.fullName}`} onClick={() => setDeleteEmployee(employee)}>
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              <footer className="table-footer">
              <span>
                Showing <strong>{employees.length ? page * pageSize + 1 : 0}–{page * pageSize + employees.length}</strong> of <strong>{totalElements}</strong> employees
              </span>

                <div className="pagination">
                  <button
                      className="page-button"
                      disabled={page <= 0 || loading}
                      onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </button>

                  <span className="page-indicator">
                  Page {totalPages ? page + 1 : 0} of {totalPages}
                </span>

                  <button
                      className="page-button"
                      disabled={page >= totalPages - 1 || loading || totalPages === 0}
                      onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </section>

            <div className="page-footer">
              <span>PeopleDesk · Employee Management System</span>
              <span>Connected to Spring Boot API</span>
            </div>
          </div>
        </main>

        {formOpen && (
            <EmployeeForm
                employee={formEmployee}
                onClose={() => {
                  setFormOpen(false)
                  setFormEmployee(null)
                }}
                onSaved={savedEmployee}
            />
        )}

        {detailsEmployee && (
            <EmployeeDetails
                employee={detailsEmployee}
                onClose={() => setDetailsEmployee(null)}
                onEdit={openEdit}
            />
        )}

        {deleteEmployee && (
            <DeleteDialog
                employee={deleteEmployee}
                onClose={() => setDeleteEmployee(null)}
                onConfirm={confirmDelete}
                deleting={deleting}
            />
        )}

        {toast && (
            <div className="toast" role="status">
              <span className="toast-check">✓</span>{toast}
            </div>
        )}
      </div>
  )
}

export default App
