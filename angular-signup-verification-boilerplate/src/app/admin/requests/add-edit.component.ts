import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { Location } from '@angular/common';

import { RequestService, EmployeeService, AlertService, AccountService, WorkflowService } from '@app/_services';
import { Request, RequestItem, Employee } from '@app/_models';

@Component({
  templateUrl: './add-edit.component.html'
})
export class AddEditComponent implements OnInit {
    id: string;
    request: Request = {
        employeeId: null,
        type: '',
        status: 'Pending',
        requestItems: []
    };
    employees: Employee[] = [];
    accounts: any[] = [];
    loading = false;
    submitting = false;
    errorMessage = '';
    currentUser = null;
    initialRequestItems = [];

    constructor(
        private requestService: RequestService,
        private employeeService: EmployeeService,
        private accountService: AccountService,
        private alertService: AlertService,
        private workflowService: WorkflowService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location
    ) {
        this.currentUser = this.accountService.accountValue;
    }

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        
        // Check for employeeId in query params for new requests
        if (!this.id) {
            this.route.queryParams.subscribe(params => {
                if (params.employeeId) {
                    this.request.employeeId = Number(params.employeeId);
                    console.log(`Pre-filling request for employee ID: ${this.request.employeeId}`);
                }
            });
        }
        
        this.loading = true;
        
        // Load reference data first
        forkJoin({
            employees: this.employeeService.getAll(),
            accounts: this.accountService.getAll()
        }).pipe(first()).subscribe({
            next: (data) => {
                this.employees = data.employees || [];
                this.accounts = data.accounts || [];
                console.log('Loaded reference data:', {
                    employees: this.employees.length,
                    accounts: this.accounts.length
                });
                
                // If this is a new request and we haven't already set the employee from query params
                if (!this.id && !this.request.employeeId && this.currentUser) {
                    // Find the employee matching the current user
                    const currentUserEmployee = this.employees.find(e => 
                        e.userId === this.currentUser.id
                    );
                    
                    if (currentUserEmployee) {
                        this.request.employeeId = currentUserEmployee.id;
                        console.log(`Auto-selected employee ID ${this.request.employeeId} for the current user`);
                    }
                }
                
                // After loading reference data, load the specific request if editing
                if (this.id) {
                    this.loadRequest();
                } else {
                    // For new requests, add at least one item row
                    if (!this.request.requestItems || !this.request.requestItems.length) {
                        this.addItem();
                    }
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading reference data:', error);
                this.errorMessage = 'Failed to load reference data';
                this.loading = false;
            }
        });

        // Initialize with at least one item
        if (!this.request.requestItems || this.request.requestItems.length === 0) {
            this.addItem();
        }
    }
    
    loadRequest() {
        this.requestService.getById(this.id)
            .pipe(first())
            .subscribe({
                next: (request) => {
                    if (request) {
                        console.log('Loaded request data for editing:', request);
                        this.request = request;
                        
                        // Fix for items not displaying - check for both RequestItems and requestItems
                        if (request['RequestItems'] && Array.isArray(request['RequestItems']) && request['RequestItems'].length > 0) {
                            console.log('Found items in RequestItems:', request['RequestItems']);
                            this.request.requestItems = request['RequestItems'];
                        } else if (!this.request.requestItems || this.request.requestItems.length === 0) {
                            console.log('No items found in request, creating empty item');
                            this.request.requestItems = [];
                            this.addItem();
                        } else {
                            console.log('Found items in requestItems:', this.request.requestItems);
                        }
                        
                        // Save a copy of the initial request items for comparison
                        this.initialRequestItems = JSON.parse(JSON.stringify(this.request.requestItems || []));
                    }
                    this.loading = false;
                },
                error: (error) => {
                    console.error(`Error loading request ${this.id}:`, error);
                    this.errorMessage = 'Failed to load request';
                    this.loading = false;
                }
            });
    }

    // Add a new request item
    addItem() {
        if (!this.request.requestItems) {
            this.request.requestItems = [];
        }
        this.request.requestItems.push({
            name: '',
            quantity: 1
        });
    }

    // Remove a request item by index
    removeItem(index: number) {
        if (this.request.requestItems) {
            this.request.requestItems.splice(index, 1);
            
            // Ensure there's always at least one item
            if (this.request.requestItems.length === 0) {
                this.addItem();
            }
        }
    }

    // Save the request
    save() {
        this.submitting = true;
        this.errorMessage = '';
        
        // Validate form
        if (!this.request.type || !this.request.employeeId) {
            this.errorMessage = 'Please fill in all required fields';
            this.submitting = false;
            return;
        }
        
        // Make sure there's at least one item with a name
        if (!this.request.requestItems || this.request.requestItems.length === 0) {
            this.addItem();
        }
        
        // Make sure all items have names
        const hasInvalidItems = this.request.requestItems.some(item => !item.name || !item.quantity || item.quantity < 1);
        if (hasInvalidItems) {
            this.errorMessage = 'Please ensure all items have a name and quantity';
            this.submitting = false;
            return;
        }

        console.log('About to save request with items:', this.request.requestItems);

        // Create a clean version of the request to send to the API
        const requestToSave = {
            ...this.request,
            // Make sure employeeId is a number
            employeeId: typeof this.request.employeeId === 'string' 
                ? parseInt(this.request.employeeId) 
                : this.request.employeeId,
            // Make sure items are properly formatted and non-empty
            requestItems: this.request.requestItems
                .filter(item => item.name && item.name.trim() !== '')
                .map(item => ({
                    id: item.id, // Keep the ID for existing items
                    name: item.name,
                    quantity: parseInt(item.quantity?.toString() || '1'),
                    description: item.description || ''
                }))
        };

        console.log('Cleaned request to save:', requestToSave);

        if (this.id) {
            // Update existing request
            this.requestService.update(this.id, requestToSave)
                .pipe(first())
                .subscribe({
                    next: (savedRequest) => {
                        this.createOrUpdateWorkflow(savedRequest);
                        this.alertService.success('Request updated', { keepAfterRouteChange: true });
                        setTimeout(() => this.router.navigate(['/admin/requests']), 500);
                    },
                    error: (error) => {
                        this.errorMessage = typeof error === 'string' ? error : 'Failed to update request';
                        this.submitting = false;
                    }
                });
        } else {
            // Create new request
            this.requestService.create(requestToSave)
                .pipe(first())
                .subscribe({
                    next: (newRequest) => {
                        this.createOrUpdateWorkflow(newRequest);
                        this.alertService.success('Request created', { keepAfterRouteChange: true });
                        setTimeout(() => this.router.navigate(['/admin/requests']), 500);
                    },
                    error: (error) => {
                        this.errorMessage = typeof error === 'string' ? error : 'Failed to create request';
                        this.submitting = false;
                    }
                });
        }
    }

    // Helper method to create or update a workflow for the request
    private createOrUpdateWorkflow(request: Request) {
        // Skip workflow creation if request is invalid
        if (!request || !request.id) {
            console.warn('Cannot create workflow for invalid request:', request);
            return;
        }
        
        // Ensure we have a valid employeeId and convert it to a number
        const employeeId = typeof request.employeeId === 'string' 
            ? parseInt(request.employeeId, 10) 
            : request.employeeId;
            
        if (!employeeId) {
            console.warn('Cannot create workflow without employeeId:', request);
            return;
        }
        
        // Format item details with name and quantity clearly displayed
        const itemsText = request.requestItems
            ? request.requestItems.map(item => {
                return `${item.name} (x${item.quantity})`;
            }).join(', ')
            : '';
        
        // Create workflow object with detailed information
        const workflow = {
            employeeId: employeeId,
            type: `${request.type} Request`,
            details: {
                items: itemsText,
                requestId: request.id
            },
            status: 'Pending' as 'Pending' | 'Approved' | 'Rejected'
        };
        
        console.log('Creating workflow for request:', workflow);
        
        // Call the workflow service to create the workflow
        this.workflowService.create(workflow)
            .pipe(first())
            .subscribe({
                next: () => console.log('Workflow created successfully for request', request.id),
                error: error => console.error('Error creating workflow:', error)
            });
    }

    cancel() {
        // When canceling, ensure we don't clear the request cache
        // Navigate to requests list, but use our back function with skipLocationChange
        // to avoid adding a new browser history entry
        
        // First, make sure any data is saved to cache before navigating
        if (this.id) {
            this.requestService.getById(this.id).pipe(first()).subscribe({
                next: () => {
                    console.log('Request data refreshed in cache before navigation');
                    this.location.back();
                },
                error: () => this.location.back()
            });
        } else {
            // Just go back for new requests
            this.location.back();
        }
    }

    // Helper method to get the employee name or email
    getEmployeeDisplay(id: number): string {
        if (id === null || id === undefined) return 'Select Employee';
        
        const employee = this.employees.find(e => e.id === id);
        if (!employee) return `Unknown (ID: ${id})`;
        
        const account = this.accounts.find(a => a.id === employee.userId);
        if (!account) return employee.employeeId;
        
        return `${account.email} (${employee.employeeId})`;
    }
}
