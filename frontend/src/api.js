const API_BASE = "http://localhost:8000/api";

export async function getTasks() {
    const res = await fetch(`${API_BASE}/list_tasks.php`);
    return res.json();
}

export async function assignTask(taskId, employeeId) {
    await fetch(`${API_BASE}/assign_task.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ 
            taskId,
            employeeId 
        })
    });
}

export async function completeTask(taskId) {
    await fetch(`${API_BASE}/create_report.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            task_id: taskId,
            description: "Task completed"
        })
    });
}

export async function invoiceTask(taskId) {
    await fetch(`${API_BASE}/invoice_task.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            task_id: taskId,
            amount: 150.00
        })
    });
}