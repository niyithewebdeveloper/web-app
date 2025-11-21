let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let taskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    renderTasks();
    updateStats();
    updateColumnCounts();
    
    // Add sample data if empty
    if (tasks.length === 0) {
        addSampleData();
    }
    
    // Setup search functionality
    document.getElementById('taskSearch').addEventListener('input', filterTasks);
    document.getElementById('priorityFilter').addEventListener('change', filterTasks);
    document.getElementById('categoryFilter').addEventListener('change', filterTasks);
    
    // Quick add with Enter key
    document.getElementById('taskTitle').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            e.preventDefault();
            document.getElementById('taskForm').dispatchEvent(new Event('submit'));
        }
    });

    // View toggle functionality
    setupViewToggle();
});

// Add new task
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.add-task-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const priority = document.getElementById('taskPriority').value;
        const category = document.getElementById('taskCategory').value;
        const dueDate = document.getElementById('taskDueDate').value;
        
        const task = {
            id: taskId++,
            title,
            description,
            priority,
            category,
            dueDate,
            status: 'todo',
            createdAt: new Date().toLocaleDateString()
        };
        
        tasks.push(task);
        saveTasks();
        renderTasks();
        updateStats();
        updateColumnCounts();
        this.reset();
        
        // Reset button state
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
        
        showNotification('Task added successfully!', 'success');
        animateAddTask(task.id);
    }, 600);
});

function setupViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Add view switching logic here if needed
        });
    });
}

function renderTasks() {
    const lists = {
        todo: document.getElementById('todoList'),
        'in-progress': document.getElementById('inProgressList'),
        done: document.getElementById('doneList')
    };
    
    // Clear all lists
    Object.values(lists).forEach(list => {
        list.innerHTML = '';
        list.classList.remove('drag-over');
    });
    
    // Get filtered tasks
    const filteredTasks = getFilteredTasks();
    
    // Add tasks to their respective lists
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        lists[task.status].appendChild(taskElement);
    });
    
    // Show empty states if no tasks
    Object.values(lists).forEach(list => {
        if (list.children.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No tasks found';
            list.appendChild(emptyState);
        }
    });
}

function getFilteredTasks() {
    const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    return tasks.filter(task => {
        const matchesSearch = !searchTerm || 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);
        
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        const matchesCategory = !categoryFilter || task.category === categoryFilter;
        
        return matchesSearch && matchesPriority && matchesCategory;
    });
}

function filterTasks() {
    renderTasks();
    updateColumnCounts();
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.status} priority-${task.priority}`;
    taskDiv.draggable = true;
    taskDiv.id = `task-${task.id}`;
    
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    
    taskDiv.innerHTML = `
        <div class="task-tags">
            <span class="task-tag ${task.category}">${task.category}</span>
            <span class="task-tag priority-${task.priority}">${task.priority} priority</span>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.description}</div>
        <div class="task-meta">
            <span class="task-date">${task.createdAt}</span>
        </div>
        ${task.dueDate ? `
            <div class="due-date ${isOverdue ? 'overdue' : ''}">
                📅 ${new Date(task.dueDate).toLocaleDateString()}
                ${isOverdue ? ' (Overdue)' : ''}
            </div>
        ` : ''}
        <div class="task-actions">
            <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            ${task.status !== 'done' ? 
                `<button class="action-btn edit-btn" onclick="moveToNext(${task.id})">
                    ${task.status === 'todo' ? 'Start' : 'Complete'}
                </button>` : ''
            }
        </div>
    `;
    
    taskDiv.addEventListener('dragstart', drag);
    taskDiv.addEventListener('dragend', dragEnd);
    
    return taskDiv;
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging');
    
    // Add drag-over effects to all columns
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.add('drag-over');
    });
}

function dragEnd(ev) {
    ev.target.classList.remove('dragging');
    
    // Remove drag-over effects
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const newStatus = ev.currentTarget.closest('.column').classList[1];
    
    // Remove dragging class and effects
    draggedElement.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
    
    // Update task status
    const taskId = parseInt(data.split('-')[1]);
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        saveTasks();
        renderTasks();
        updateStats();
        updateColumnCounts();
        showNotification('Task moved!', 'success');
        animateTaskMove(taskId);
    }
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskElement = document.getElementById(`task-${id}`);
        taskElement.style.transform = 'scale(0.8)';
        taskElement.style.opacity = '0';
        
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            updateColumnCounts();
            showNotification('Task deleted!', 'error');
        }, 300);
    }
}

function moveToNext(id) {
    const task = tasks.find(task => task.id === id);
    if (task.status === 'todo') {
        task.status = 'in-progress';
    } else if (task.status === 'in-progress') {
        task.status = 'done';
        celebrateCompletion();
    }
    saveTasks();
    renderTasks();
    updateStats();
    updateColumnCounts();
    showNotification('Task updated!', 'success');
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'done').length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const overdue = tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
    ).length;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('inProgressTasks').textContent = inProgress;
    document.getElementById('overdueTasks').textContent = overdue;
    
    // Animate stat changes
    animateStatCounter('totalTasks', total);
    animateStatCounter('completedTasks', completed);
    animateStatCounter('inProgressTasks', inProgress);
    animateStatCounter('overdueTasks', overdue);
}

function animateStatCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent);
    
    if (currentValue !== targetValue) {
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }
}

function updateColumnCounts() {
    const filteredTasks = getFilteredTasks();
    
    document.getElementById('todoCount').textContent = 
        filteredTasks.filter(task => task.status === 'todo').length;
    document.getElementById('inProgressCount').textContent = 
        filteredTasks.filter(task => task.status === 'in-progress').length;
    document.getElementById('doneCount').textContent = 
        filteredTasks.filter(task => task.status === 'done').length;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    // Update taskId to be max id + 1
    taskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
}

function addSampleData() {
    const sampleBtn = document.querySelector('.sample-data-btn');
    const originalText = sampleBtn.textContent;
    
    sampleBtn.textContent = 'Adding Sample Tasks...';
    sampleBtn.disabled = true;
    
    setTimeout(() => {
        const sampleTasks = [
            {
                id: taskId++,
                title: "Complete project proposal",
                description: "Finish the client project proposal document",
                priority: "high",
                category: "work",
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: "todo",
                createdAt: new Date().toLocaleDateString()
            },
            {
                id: taskId++,
                title: "Grocery shopping",
                description: "Buy fruits, vegetables, and household items",
                priority: "medium",
                category: "shopping",
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: "todo",
                createdAt: new Date().toLocaleDateString()
            },
            {
                id: taskId++,
                title: "Morning workout",
                description: "30 minutes of cardio and strength training",
                priority: "low",
                category: "health",
                dueDate: new Date().toISOString().split('T')[0],
                status: "in-progress",
                createdAt: new Date().toLocaleDateString()
            },
            {
                id: taskId++,
                title: "Team meeting preparation",
                description: "Prepare slides and talking points for weekly team meeting",
                priority: "medium",
                category: "work",
                dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: "done",
                createdAt: new Date().toLocaleDateString()
            }
        ];
        
        tasks.push(...sampleTasks);
        saveTasks();
        renderTasks();
        updateStats();
        updateColumnCounts();
        
        sampleBtn.textContent = originalText;
        sampleBtn.disabled = false;
        
        showNotification('Sample tasks added!', 'success');
    }, 1000);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.getElementById('notificationContainer').appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function animateAddTask(taskId) {
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
        taskElement.style.transform = 'scale(0.8)';
        taskElement.style.opacity = '0';
        
        setTimeout(() => {
            taskElement.style.transition = 'all 0.3s ease';
            taskElement.style.transform = 'scale(1)';
            taskElement.style.opacity = '1';
        }, 50);
    }
}

function animateTaskMove(taskId) {
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
        taskElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            taskElement.style.transform = 'scale(1)';
        }, 300);
    }
}

function celebrateCompletion() {
    // Simple celebration effect
    const celebration = document.createElement('div');
    celebration.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, transparent 20%, rgba(16, 196, 138, 0.1) 20%, rgba(16, 196, 138, 0.1) 80%, transparent 80%, transparent);
        background-size: 50px 50px;
        pointer-events: none;
        z-index: 1002;
        opacity: 0;
        animation: celebrate 1s ease-out;
    `;
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        celebration.remove();
    }, 1000);
}

// Add CSS for celebration animation
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrate {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.2); }
    }
`;
document.head.appendChild(style);